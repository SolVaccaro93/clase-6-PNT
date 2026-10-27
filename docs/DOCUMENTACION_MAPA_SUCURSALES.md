# Documentación Técnica: Mapa de Sucursales

## 📌 Requerimiento
Mapa interactivo (Leaflet + OpenStreetMap) con un marcador por sucursal que muestra su nombre, dirección y los libros disponibles. Mejora de UX: íconos propios y no mostrar el mapa cuando no hay nada disponible.

## 🖥️ Dónde aparece
| Pantalla | Qué muestra cada marcador |
|---|---|
| **Sucursales** (`/#/sucursales`) | Cantidad de títulos disponibles en esa sede y los primeros 5, con link al detalle. Si hay más, **"Ver N títulos más"** despliega el resto en el mismo popup. |
| **Detalle del libro** (`/#/libros/:id`) | Ejemplares de **ese** libro en cada sede. |

## 📍 Marcadores
* Pin con forma de gota: **verde con 📚** si hay stock, **rojo con 📕** si no.
* Un globito arriba del pin muestra la cantidad (títulos o ejemplares).
* Al pasar el mouse aparece el nombre de la sucursal; al hacer clic, el popup con el detalle.
* Debajo del mapa, una barra de leyenda con:
  * dos chips, **Con stock** y **Sin stock**, con un mini pin igual al del mapa y un contador (si es 0, el chip queda atenuado);
  * el resumen ("2 de 3 sucursales con ejemplares") y una barra de progreso con el porcentaje de sucursales con stock.
  * En celular, el resumen y la barra pasan debajo de los chips.
* Los colores salen de las variables del tema (`--color-success`, `--color-danger`), porque el pin es HTML (`L.divIcon`) y no SVG.

## 🔘 Chips interactivos: "Con stock" y "Sin stock"
Los dos chips de la leyenda son botones. Al tocar uno:

1. **Filtra el mapa:** los pines que coinciden quedan resaltados, el resto se atenúa (opacidad 0,3), y el mapa se acerca a los que coinciden.
2. **Abre un panel** debajo con la información de los libros (ver tabla).
3. Cada sucursal del panel tiene **📍 Ver en el mapa**, que centra el mapa en ella y abre su popup.

Tocar de nuevo el chip activo, o la ✕ del panel, vuelve a la vista inicial. El chip activo se marca con un aro de su color (`aria-pressed="true"`).

Lo que cuentan los chips cambia según la pantalla, para que siempre digan algo útil:

| Pantalla | Chip | Cuenta | Panel al tocarlo |
|---|---|---|---|
| **Sucursales** | Con stock | Títulos con ejemplares en alguna sede | Cuántos títulos hay disponibles en cada sucursal, de la que más tiene a la que menos. |
| **Sucursales** | Sin stock | Títulos agotados en **al menos una** sede | Esos títulos con portada, autor, link al detalle y el stock en cada sede (`Centro: 3 · Floresta: agotado`). Los agotados en todas las sedes van primero. |
| **Detalle del libro** | Con stock | Sucursales con ejemplares | "Dónde retirar": cada sucursal con su dirección y cantidad de ejemplares. |
| **Detalle del libro** | Sin stock | Sucursales sin ejemplares | Esas sucursales y la sugerencia "Lo podés retirar en Centro (3), Belgrano (2)". |

* Si un contador es 0, el chip queda atenuado pero se puede tocar: muestra un mensaje positivo (por ejemplo, "🎉 Todas las sucursales tienen ejemplares de este libro").
* El popup de cada sucursal (pantalla Sucursales) también muestra cuántos títulos están agotados ahí.
* Todo se recalcula con `cambiosStock`, igual que los pines.

## 🚫 Cuándo no se muestra el mapa
En lugar del mapa aparece un aviso si:

| Caso | Mensaje |
|---|---|
| No hay sucursales con ubicación | "Todavía no hay sucursales cargadas para mostrar en el mapa." |
| Detalle: el libro no tiene ejemplares en ninguna sede | "Este libro no tiene ejemplares disponibles en ninguna sucursal por ahora." + link al catálogo |
| Sucursales: ninguna sede tiene libros | "Ninguna sucursal tiene libros disponibles por ahora." |

Si hay al menos una sede con stock, el mapa se muestra con **todas** las sedes (las que no tienen stock aparecen en rojo, como referencia).

## 🔄 Actualización automática
El componente escucha `cambiosStock`: cuando alguien retira o devuelve un libro, los pines cambian de color y cantidad sin recargar. Si el stock llega a 0 en todas las sedes, el mapa se reemplaza por el aviso, y vuelve a aparecer cuando hay stock otra vez.

## 🛠️ Código
Todo está en `src/components/MapaSucursales.vue`:
* `icono(sucursal)`: arma el pin con `L.divIcon` según la cantidad.
* `contenidoPopup(sucursal)`: arma el HTML del popup. Los títulos que pasan de 5 van dentro de un `<details>`, que se despliega sin JavaScript.
* El popup se arma en el evento `popupopen` como un elemento HTML (así muestra el stock del momento). Al desplegar la lista se llama a `popup.update()` para que Leaflet lo reacomode; el popup tiene `maxHeight: 230` y scrollea si la lista es larga.
* `sedesConStock` y `mostrarMapa` (computed): deciden si se muestra el mapa o el aviso.
* `stockPorTitulo`, `titulosSinStock`, `sucursalesSinEjemplares` y `sucursalesConEjemplares` (computed): arman la información del panel "Sin stock". `chips` decide qué cuentan los chips según el modo.
* `filtro` (`"con"`, `"sin"` o `null`): chip elegido. `coincideConFiltro`, `resaltarPines` y `aplicarFiltro` atenúan los pines y encuadran el mapa; `verEnMapa(id)` centra una sucursal y abre su popup.
* `actualizarMapa()`: crea, actualiza los íconos o destruye el mapa. Se llama al montar y cuando cambian el stock o `mostrarMapa` (con `flush: "post"`, para esperar a que Vue muestre u oculte el contenedor).
* Las ubicaciones vienen de `src/services/ubicacionesSucursales.js` (datos de ejemplo hasta tener los reales).
