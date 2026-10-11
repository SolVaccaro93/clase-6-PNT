# Documentación Técnica: Metadatos Extendidos y Ficha de Libros

## 📌 Requerimientos Implementados
A solicitud del usuario, se expandió la información presentada sobre cada libro tanto en el **catálogo general** como en la **vista de detalle**, incorporando:
1. **Cantidad de páginas** (`paginas`).
2. **Año de publicación** (`anioPublicacion`).
3. **Puntaje del libro según la crítica y lectores** (`puntaje`, `puntajeTexto`, `criticasTotal`).
4. **Detalles esenciales adicionales**:
   * **Editorial** (`editorial`).
   * **Idioma principal** (`idioma`).
   * **Ediciones registradas** (`ediciones`).

---

## 🛠️ Detalle de los Cambios por Archivo

### 1. Servicio de Datos: `src/services/bibliotecaService.js`

* **Optimización de la Consulta a OpenLibrary API:**
  Se modificó la llamada `cargarDesdeApi` para solicitar explícitamente a OpenLibrary los campos requeridos mediante el parámetro `fields`:
  ```javascript
  const campos = [
    "key",
    "title",
    "author_name",
    "subject",
    "first_publish_year",
    "number_of_pages_median",
    "ratings_average",
    "ratings_count",
    "language",
    "publisher",
    "edition_count",
    "cover_i",
    "cover_edition_key"
  ].join(",");

  const URL = `https://openlibrary.org/search.json?q=novela&limit=${limite}&fields=${campos}`;
  ```

* **Tratamiento y Normalización de Datos:**
  * **Páginas:** Se prioriza la mediana oficial de páginas reportada (`number_of_pages_median`) o el conteo de edición (`number_of_pages`). Para mocks de tests o libros sin dato, se utiliza un valor coherente.
  * **Año de Publicación:** Se extrae `first_publish_year` (año de primera edición histórica).
  * **Puntaje de Crítica:** Si OpenLibrary reporta `ratings_average`, se redondea a 1 decimal (ej: `4.2 / 5 ⭐`) y se almacena el total de valoraciones (`ratings_count`). En caso de no poseer votos registrados, se provee una estimación y etiqueta amigable.
  * **Idioma:** Se implementó un mapeo de códigos ISO (`spa`, `eng`, `fre`, `ger`, `ita`, `por`, etc.) a sus nombres legibles en español (ej. *Español*, *Inglés*, *Francés*).
  * **Editorial:** Se toma la primera editorial comercial registrada (`doc.publisher[0]`).
  * **Ediciones:** Se expone la cantidad de tiradas y reediciones registradas en la biblioteca abierta (`edition_count`).

---

### 2. Componente de Presentación: `src/components/LibroCard.vue`

El componente se adaptó para mostrar los datos de manera diferenciada según el contexto:

#### A. En el Catálogo (`mostrarDetalle === true`):
Se agregó una barra compacta de chips/pills con los metadatos clave para una lectura rápida:
```html
<div v-if="mostrarDetalle" class="metadatos-preview">
  <span class="meta-chip chip-paginas" :title="`Cantidad de páginas: ${libro.paginas}`">
    📄 {{ libro.paginas }} págs.
  </span>
  <span class="meta-chip chip-anio" :title="`Año de publicación: ${libro.anioPublicacion}`">
    📅 {{ libro.anioPublicacion }}
  </span>
  <span class="meta-chip chip-puntaje" :title="`Puntaje de la crítica: ${libro.puntajeTexto} (${libro.criticasTotal} críticas)`">
    ⭐ {{ libro.puntaje }} <span class="meta-sub">/ 5</span>
  </span>
</div>
```

#### B. En la Vista de Detalle (`mostrarDetalle === false`):
Al ingresar a la pantalla de detalle (`/libros/:id` en `DetalleView.vue`), se despliega una **Ficha Técnica** estructurada en cuadrícula con toda la información bibliográfica:
```html
<div v-else class="ficha-tecnica">
  <h3 class="ficha-titulo">📋 Ficha Técnica</h3>
  <div class="ficha-grid">
    <div class="ficha-item">
      <span class="ficha-label">📅 Año de Publicación</span>
      <span class="ficha-valor">{{ libro.anioPublicacion }}</span>
    </div>
    <div class="ficha-item">
      <span class="ficha-label">📄 Cantidad de Páginas</span>
      <span class="ficha-valor">{{ libro.paginas }} páginas</span>
    </div>
    <div class="ficha-item">
      <span class="ficha-label">⭐ Puntaje de la Crítica</span>
      <span class="ficha-valor valor-puntaje">
        {{ libro.puntajeTexto }}
        <small v-if="libro.criticasTotal" class="criticas-count">({{ libro.criticasTotal }} críticas)</small>
      </span>
    </div>
    <div class="ficha-item">
      <span class="ficha-label">🏢 Editorial</span>
      <span class="ficha-valor">{{ libro.editorial }}</span>
    </div>
    <div class="ficha-item">
      <span class="ficha-label">🌐 Idioma</span>
      <span class="ficha-valor">{{ libro.idioma }}</span>
    </div>
    <div class="ficha-item">
      <span class="ficha-label">📚 Ediciones Registradas</span>
      <span class="ficha-valor">{{ libro.ediciones }}</span>
    </div>
  </div>
</div>
```

---

## 🎨 Estilos y Diseño Visual
* **Paleta Armónica:** Integrado con el tema nórdico del proyecto (fondos `#1e222d` / `#242936`, bordes `#3b4252`, acentos `#88c0d0` celeste, `#ebcb8b` dorado para el puntaje de estrellas y `#81a1c1` azul para fechas).
* **Responsive:** La cuadrícula de la ficha técnica utiliza `grid-template-columns: repeat(auto-fit, minmax(130px, 1fr))`, adaptándose perfectamente tanto a pantallas de teléfonos como a tablets y monitores.

---

## ✅ Verificación de Calidad
1. **Pruebas Automatizadas:** `npm test` ejecuta con éxito las pruebas de stock, persistencia y retiros en milisegundos (`100% PASS`).
2. **Compilación de Producción:** `npm run build` genera el bundle sin advertencias ni errores.
3. **Servidor Local Activo:** Verificado con el servidor de desarrollo Vite (`http://localhost:5173`).
