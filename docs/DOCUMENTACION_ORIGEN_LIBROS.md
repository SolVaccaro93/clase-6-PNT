# Documentación Técnica: Libros Argentinos y Filtro por Origen

## 📌 Requerimiento (Tarea 14)
Traer más libros argentinos o poder filtrar por origen. Hasta ahora, el catálogo solo consultaba `q=novela`. Se implementaron las dos cosas.

## 🖥️ Qué ve el usuario
* El catálogo pasa de 25 a **hasta 40 libros**: los 25 generales y hasta 15 de autores argentinos, al final de la lista.
* En **Listado** hay un selector **Origen**: `Todos`, `Argentina` u `Otros países`. Se combina con los demás filtros.
* Los libros argentinos muestran el chip `📍 Argentina` en su tarjeta.

## ⚙️ Regla de negocio
OpenLibrary **no informa el país de origen** de un libro, y sus temas no son confiables: `subject:"novela argentina"` incluye autores de otros países y `subject:"argentine fiction"` incluye novelas románticas ambientadas en Argentina. Por eso el origen se decide por autor:

* Un libro es de origen `Argentina` si alguno de sus autores está en `AUTORES_ARGENTINOS`. Si no, es `Otros países`.
* La comparación ignora mayúsculas y tildes ("Sabato" = "Sábato").
* La regla vale para todo el catálogo, incluidos los libros de la búsqueda general.
* Se traen como máximo 15 libros argentinos y 2 por autor, para que haya variedad.
* Un libro que ya vino en la búsqueda general no se repite.

## 🛠️ Cambios en el código

### 1. Archivo nuevo: `src/services/autoresArgentinos.js`
* `AUTORES_ARGENTINOS`: la lista de autores. **Para sumar uno, alcanza con agregarlo acá.**
* `autorArgentinoDe(autores)`: devuelve el primer autor argentino de un libro, o `null`.
* `consultaAutoresArgentinos()`: arma la consulta `author:("..." OR "...")`.

### 2. `src/services/bibliotecaService.js`
* `buscarDocsArgentinos(campos)`: hace la segunda consulta y aplica los máximos.
* `cargarDesdeApi` hace las dos consultas a la vez y agrega los argentinos **al final**, para que los libros generales conserven su id y su stock.
* Cada libro tiene el campo nuevo `origen`.
* `buscar` acepta `filtros.origen`.

### 3. `src/views/ListadoView.vue` y `src/components/LibroCard.vue`
El selector **Origen** y el chip `📍 Argentina`.

### 4. `tests/origen.test.js`
Comprueba los máximos, que no haya repetidos, el filtro y qué pasa si falla la consulta.

## ⚠️ Limitaciones
* **Si falla la consulta de argentinos**, el catálogo se carga igual con los libros generales. Si falla la general, se muestra el error con "Reintentar", como antes.
* **El origen depende de la lista:** un autor argentino que no esté en ella figura en `Otros países`.
* **El origen es el del autor**, no el del libro ni el de la edición.
* **Algunos títulos llegan en inglés o repetidos** (por ejemplo, *The Invention of Morel* junto a *La invención de Morel*), porque OpenLibrary los registra como obras separadas.
