# Documentación Técnica: Filtros por Editorial, Año de Publicación e Idioma

## 📌 Requerimiento
Agregar al buscador del listado la **búsqueda por editorial, año de publicación e idioma**.

## 🖥️ Qué ve el usuario
En **Listado** (`/#/libros`), después de "Páginas", aparecen cuatro campos nuevos:

| Campo | Tipo | Comportamiento |
|---|---|---|
| Editorial | Selector | "Todas" (por defecto) o una editorial del catálogo, en orden alfabético |
| Idioma | Selector | "Todos" (por defecto) o un idioma del catálogo, en orden alfabético |
| Año desde | Número | Muestra libros publicados en ese año o después. Vacío = sin límite |
| Año hasta | Número | Muestra libros publicados en ese año o antes. Vacío = sin límite |

Se combinan con los demás filtros (texto, género, estrellas y páginas): un libro aparece solo si los cumple todos.
Como ahora hay más campos, la barra de filtros pasa a varias líneas (`flex-wrap`); el buscador de texto ocupa la primera línea entera.

## ⚙️ Reglas de negocio
* Se usan los campos `editorial`, `idioma` y `anioPublicacion` de cada libro, los mismos de la ficha técnica. Ver `DOCUMENTACION_METADATOS_LIBROS.md` para saber cómo se obtienen.
* Editorial e idioma se comparan **exactos**, sin distinguir mayúsculas.
* El año se filtra por **rango** con los dos extremos incluidos: `anioDesde <= anioPublicacion <= anioHasta`. Se puede completar uno solo de los dos.
* Los libros sin año numérico (los que muestran "Clásico") **quedan afuera** cuando se completa algún año, porque no se sabe si están en el rango.

## 🛠️ Cambios en el código

### 1. `src/services/bibliotecaService.js`
`buscar` recibe un quinto parámetro opcional, un objeto con los filtros nuevos:

```javascript
buscar(texto = "", genero = "", estrellasMinimas = 0, rangoPaginas = null, filtros = {})
// filtros: { editorial, idioma, anioDesde, anioHasta } (todos opcionales)
```

Se usó un objeto en lugar de cuatro parámetros sueltos más para que las llamadas sigan siendo legibles. Con el valor por defecto se comporta igual que antes, así que las llamadas existentes (mapa, amigos) no cambian.

Nuevos métodos, igual que `getGeneros`:
* `getEditoriales()`: editoriales sin repetidos, ordenadas.
* `getIdiomas()`: idiomas sin repetidos, ordenados.

### 2. `src/views/ListadoView.vue`
* `editorialSeleccionada` / `editoriales` e `idiomaSeleccionado` / `idiomas`: valor elegido y opciones de cada selector, cargadas al traer los libros.
* `anioDesde` / `anioHasta`: inputs numéricos con `v-model.number`. Al borrarlos quedan en `""`, que el service toma como "sin límite".
* `librosFiltrados` pasa los cuatro valores a `BibliotecaService.buscar`.

### 3. `tests/busqueda.test.js`
Prueba cada filtro por separado, combinados, los extremos del rango de años y que los campos vacíos no filtren.
