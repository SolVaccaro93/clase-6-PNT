# Documentación Técnica: Filtro por Cantidad de Páginas

## 📌 Requerimiento
Agregar al buscador del listado un filtro para **buscar por cantidad de páginas**.

## 🖥️ Qué ve el usuario
En **Listado** (`/#/libros`), al lado de "Estrellas", hay un selector **Páginas**:

| Opción | Muestra |
|---|---|
| Todas | Todos los libros (valor por defecto) |
| 📄 Hasta 200 | Libros de 0 a 200 páginas |
| 📄 201 a 400 | Libros de 201 a 400 páginas |
| 📄 Más de 400 | Libros de 401 páginas o más |

Se combina con los demás filtros (texto, género y estrellas): un libro aparece solo si los cumple todos.

## ⚙️ Regla de negocio
* Se usa el campo `paginas` de cada libro, el mismo que se ve en la tarjeta como `📄 376 págs.` Ver `DOCUMENTACION_METADATOS_LIBROS.md` para saber cómo se obtiene.
* A diferencia de las estrellas (que filtran por mínimo), las páginas se filtran por **rango**, con los dos extremos incluidos: `min <= paginas <= max`.
* Los rangos se eligieron para repartir el catálogo actual en tres grupos parecidos (los libros tienen entre 88 y 752 páginas).

## 🛠️ Cambios en el código

### 1. `src/services/bibliotecaService.js`
`buscar` recibe un cuarto parámetro opcional:

```javascript
buscar(texto = "", genero = "", estrellasMinimas = 0, rangoPaginas = null)
// rangoPaginas: { min, max } o null (sin filtro)
```

Con el valor por defecto (`null`) se comporta igual que antes, así que las llamadas existentes no cambian.

### 2. `src/views/ListadoView.vue`
* `rangoPaginas`: opción elegida en el selector (`"todas"`, `"cortos"`, `"medianos"` o `"largos"`).
* `OPCIONES_PAGINAS`: lista de opciones con su rango (`{ min, max }`). Para cambiar los rangos alcanza con editarla; "Más de 400" usa `max: Infinity`.
* `librosFiltrados` busca la opción elegida y pasa su rango a `BibliotecaService.buscar`.
