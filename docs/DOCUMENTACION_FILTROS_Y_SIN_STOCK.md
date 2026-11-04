# Documentación Técnica: Panel de Filtros y Libros sin Stock

## 📌 Requerimiento
1. El listado llegó a 8 campos de búsqueda y ocupaba mucha pantalla: hacerlo más cómodo.
2. Definir qué ve el usuario cuando un libro no tiene stock.

## 🔎 Panel de filtros (`src/views/ListadoView.vue`)

| Parte | Qué hace |
|---|---|
| **Buscador** | Siempre visible. Busca por título o autor. |
| **Botón Filtros** | Abre o cierra el panel con los demás filtros. Está cerrado al entrar y muestra cuántos filtros hay activos. |
| **Panel** | Género, Origen, Idioma, Editorial, Estrellas, Páginas y Año de publicación (desde y hasta juntos). |
| **Contador** | "11 de 40 libros". Se anuncia a los lectores de pantalla (`role="status"`). |
| **Chips activos** | Un chip por filtro en uso (`Origen: Argentina ✕`). Tocarlo quita ese filtro. Se ven aunque el panel esté cerrado. |
| **Limpiar todo** | Aparece con 2 o más filtros activos. |
| **Sin resultados** | Mensaje con el botón "Limpiar búsqueda y filtros". |

**Por qué así:** la mayoría de las veces alcanza con el buscador, así que el resto queda a un clic. Como los filtros activos se ven como chips, cerrar el panel no oculta qué se está aplicando.

### Código
* `panelAbierto`: si el panel está abierto. Usa `v-show`, para que los filtros conserven su valor.
* `filtrosActivos` (computed): lista de `{ clave, texto, quitar }`. Con ella se arman los chips y el contador del botón.
* `textoAnio` (computed): arma el texto del chip de año.
* `limpiarFiltros()`: llama al `quitar()` de cada filtro y vacía el buscador.

Para sumar un filtro nuevo: agregar su campo al panel y un `agregar(...)` en `filtrosActivos`.

## 📕 Libros sin stock (`src/components/LibroCard.vue`)

| Situación | Qué se muestra |
|---|---|
| Hay stock en alguna sucursal | Disponibilidad, selector (solo con las sucursales que tienen stock) y **Retirar libro**. |
| Agotado en todas las sucursales | El aviso "📕 Agotado en todas las sucursales". Sin selector ni botón. |
| El usuario lo tiene prestado | **Devolver y terminar**, haya stock o no. |

**Por qué se quita el botón en lugar de deshabilitarlo:** un botón deshabilitado invita a tocarlo, no explica qué pasa y, en esta tarjeta, ocupaba el mismo lugar que una acción real. Como no hay ninguna acción posible (no existe lista de espera), el aviso dice directamente el motivo.

### Código
* `agotado` (computed): hay datos de disponibilidad y ninguna sucursal tiene stock. Si la consulta falló, no se considera agotado: se muestra el error.
* Se actualiza solo con `cambiosStock`: si alguien devuelve el libro, vuelven el selector y el botón.
