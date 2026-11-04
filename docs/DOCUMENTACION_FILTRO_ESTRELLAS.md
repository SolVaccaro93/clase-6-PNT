# Documentación Técnica: Filtro por Cantidad de Estrellas

## 📌 Requerimiento
Agregar al buscador del listado un filtro para **buscar por cantidad de estrellas**.

## 🖥️ Qué ve el usuario
En **Listado** (`/#/libros`), dentro del panel **Filtros**, hay un selector **Estrellas**:

| Opción | Muestra |
|---|---|
| Todas | Todos los libros (valor por defecto) |
| ⭐ 3 o más | Libros con puntaje ≥ 3 |
| ⭐ 3,5 o más | Libros con puntaje ≥ 3,5 |
| ⭐ 4 o más | Libros con puntaje ≥ 4 |
| ⭐ 4,5 o más | Libros con puntaje ≥ 4,5 |

Se combina con los otros dos filtros: un libro aparece solo si cumple texto, género **y** estrellas. Si ninguno cumple, se muestra "No se encontraron libros".

## ⚙️ Regla de negocio
* Las estrellas son el puntaje vigente del libro (de 0 a 5, con un decimal): el puntaje original de OpenLibrary (campo puntaje) combinado con los votos de los usuarios de la app. Es el mismo número que se ve en las estrellas de la tarjeta. Ver DOCUMENTACION_VOTOS_ESTRELLAS.md para la fórmula y DOCUMENTACION_METADATOS_LIBROS.md para el puntaje original.
* El filtro es por **mínimo**: `puntaje >= estrellasMinimas`.
* Un libro sin puntaje cuenta como 0.

## 🛠️ Cambios en el código

### 1. `src/services/bibliotecaService.js`
`buscar` recibe un tercer parámetro opcional:

```javascript
buscar(texto = "", genero = "", estrellasMinimas = 0)
```

Con el valor por defecto (`0`) se comporta igual que antes, así que las llamadas existentes no cambian.

### 2. `src/views/ListadoView.vue`
* `estrellasMinimas`: valor elegido en el selector.
* `OPCIONES_ESTRELLAS`: lista de opciones; para agregar o cambiar umbrales alcanza con editarla.
* `librosFiltrados` pasa el valor a `BibliotecaService.buscar`.

Desde la función de votos, buscar compara estrellasMinimas contra useVotosStore().puntajeVigente(libro) en lugar de libro.puntaje.