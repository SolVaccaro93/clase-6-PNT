# Documentación Técnica: Filtro por Cantidad de Estrellas

## 📌 Requerimiento
Agregar al buscador del listado un filtro para **buscar por cantidad de estrellas**.

## 🖥️ Qué ve el usuario
En **Listado** (`/#/libros`), junto a "Buscar libro" y "Género", hay un selector **Estrellas**:

| Opción | Muestra |
|---|---|
| Todas | Todos los libros (valor por defecto) |
| ⭐ 3 o más | Libros con puntaje ≥ 3 |
| ⭐ 3,5 o más | Libros con puntaje ≥ 3,5 |
| ⭐ 4 o más | Libros con puntaje ≥ 4 |
| ⭐ 4,5 o más | Libros con puntaje ≥ 4,5 |

Se combina con los otros dos filtros: un libro aparece solo si cumple texto, género **y** estrellas. Si ninguno cumple, se muestra "No se encontraron libros".

## ⚙️ Regla de negocio
* Las estrellas son el campo `puntaje` de cada libro (de 0 a 5, con un decimal), el mismo que se ve en la tarjeta como `⭐ 4.2 / 5`. Ver `DOCUMENTACION_METADATOS_LIBROS.md` para saber cómo se obtiene.
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
