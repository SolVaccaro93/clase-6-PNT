# Documentación Técnica: Catálogo de Autores Argentinos y Latinoamericanos

## 📌 Requerimiento Implementado
Antes, el catálogo salía de una búsqueda genérica a OpenLibrary (`q=novela`), que traía libros de cualquier origen y calidad. Se cambió para que el catálogo se arme **solo con obras de una lista curada de autores argentinos y latinoamericanos**. Así la vista del dueño (Panel de Administración) parte de un catálogo acotado y coherente para elegir.

---

## 🛠️ Detalle de los Cambios por Archivo

### 1. Servicio de Datos: `src/services/bibliotecaService.js`

* **Lista curada de autores (`AUTORES_CATALOGO`):**
  Constante exportada con el nombre y el país de cada autor:

  | País | Autores |
  |------|---------|
  | Argentina | Jorge Luis Borges, Julio Cortázar, Ernesto Sabato, Adolfo Bioy Casares, Manuel Puig, Roberto Arlt, Silvina Ocampo, Alejandra Pizarnik, Ricardo Piglia, Samanta Schweblin, Mariana Enriquez |
  | Colombia | Gabriel García Márquez |
  | Perú | Mario Vargas Llosa |
  | Chile | Isabel Allende, Roberto Bolaño |
  | México | Juan Rulfo, Carlos Fuentes, Octavio Paz |
  | Uruguay | Mario Benedetti, Eduardo Galeano, Horacio Quiroga |
  | Cuba | Alejo Carpentier |

  Para sumar o sacar autores alcanza con editar esta lista.

* **Una consulta por autor, en paralelo:**
  ```javascript
  const URL = `https://openlibrary.org/search.json?author=${encodeURIComponent(autor.nombre)}` +
    `&language=spa&sort=editions&limit=10&fields=${campos}`;
  ```
  * `language=spa`: solo obras con edición en español.
  * `sort=editions`: primero las obras con más ediciones, que son las más conocidas (en Cortázar: *Rayuela*, *62/Modelo para armar*, *Final del juego*…), y no antologías o estudios sobre el autor.

* **Filtros de calidad ("no traer cualquier cosa"):**
  1. El autor buscado tiene que ser el **autor principal** (`author_name[0]`). La comparación ignora tildes y mayúsculas con `normalizar()`, así "Sábato" coincide con "Sabato".
  2. La obra tiene que tener **portada** (`cover_i` o `cover_edition_key`).
  3. Se toman como máximo **`OBRAS_POR_AUTOR` (3)** obras por autor.
  4. **Sin repetidos:** se descartan obras con la misma clave de OpenLibrary o con el mismo título normalizado.

* **Tolerancia a fallos:** se usa `Promise.allSettled`. Si falla la consulta de un autor, el catálogo se carga igual con el resto, y solo se lanza error si fallan **todas**.

* **Nuevo campo `pais`:** cada libro incluye el país del autor (por ejemplo `"Argentina"`, `"Colombia"`), disponible para la vista del dueño.

* **Idioma:** OpenLibrary devuelve los idiomas de todas las ediciones de la obra. Si incluye `spa`, el libro se muestra como **Español**. Si no, se usa el primer idioma, como antes.

* **Límite por defecto:** `cargarLibros()` ahora usa por defecto `AUTORES_CATALOGO.length * OBRAS_POR_AUTOR` (unos 66 libros) en lugar de 25.

### 2. Llamadas a `cargarLibros`
Se quitó el `cargarLibros(25)` fijo en `ListadoView.vue`, `DetalleView.vue`, `SucursalesView.vue`, `AdminView.vue` y `amigosService.js`. Ahora todos usan el límite por defecto del servicio.

---

## ⚠️ Consideraciones
* **Tiempo de carga:** son 22 consultas a OpenLibrary (una por autor), que a veces responde lento, así que la primera carga puede tardar más que antes. Después el catálogo queda en memoria (`catalogoCargado`) y no se vuelve a pedir.
* **Stock y préstamos guardados:** se guardan con la clave de OpenLibrary (`libro.clave`), así que se conservan para los libros que siguen en el catálogo. Los libros del catálogo anterior que no sean de estos autores dejan de aparecer.
* **Configuración rápida:**
  * Más o menos autores → editar `AUTORES_CATALOGO`.
  * Más o menos obras por autor → cambiar `OBRAS_POR_AUTOR`.

---

## ✅ Verificación
* Se probó con curl la consulta por autor (`author=Julio Cortázar&language=spa&sort=editions`), que devolvió obras canónicas con portada y título en español.
* **Pendiente:** verificar la carga completa del catálogo en el navegador (`npm run dev`). Durante el desarrollo OpenLibrary no respondió desde la terminal, así que no se pudo comprobar la lista final con datos reales.
