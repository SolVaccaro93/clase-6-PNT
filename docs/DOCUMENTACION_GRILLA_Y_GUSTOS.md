# Documentación Técnica: Animación de la grilla y catálogo según los gustos

Corresponde al commit `fe89cb1` ("arreglo animacion grilla, cuestionario gustos") y al anterior (`da5be19`), que borró lo que ya no se usaba.

## 📌 Qué cambió
1. Se arregló la animación de la portada en la grilla de rombos.
2. El catálogo ya no se arma con autores fijos. Se pide a OpenLibrary **filtrado por los gustos del quiz**.
3. Se sacó todo lo relacionado con el origen del autor (argentino u otros).

## 1. Animación de la grilla (`src/components/GrillaLibros.vue`)
**Problema:** al pasar el mouse, la portada saltaba hacia abajo y el hover parpadeaba sin parar.

**Causa:** la regla global de `prefers-reduced-motion` anula `transform` en `:hover`. El link usaba `transform` para centrarse, así que al hacer hover perdía el centrado, se movía, perdía el hover y volvía.

**Arreglo:**
* El link se centra con la propiedad `translate: -50% -60%`, que esa regla no toca.
* La animación es más simple: la portada sube 8% y la sombra se agranda (`transform: translateY(-8%)`, 0,2 s). Antes rotaba 25° y se corría a un costado.
* No rota ni pasa por encima del "bolsillo" del rombo, porque así se veía que se caía.
* El hover se mide sobre el link, que queda quieto, así la zona de hover no cambia mientras se anima.

## 2. Catálogo filtrado por los gustos (`src/services/bibliotecaService.js`)
**Antes:** se hacían 22 búsquedas por autor (lista `AUTORES_CATALOGO`) y se filtraba en el navegador.

**Ahora:** una sola consulta a OpenLibrary, armada con `armarUrlBusqueda` a partir de las respuestas del quiz:
```
subject:"<género>" AND language:<idioma> AND first_publish_year:[<desde> TO <hasta>]
```
ordenada por cantidad de ediciones, con un máximo de 40 libros (`LIMITE_LIBROS`).

* **`GENEROS_QUIZ` e `IDIOMAS_QUIZ`:** son listas fijas, con el nombre que se ve y el tema o código que entiende la API. Ya no salen del catálogo cargado.
* **`cargarLibros(preferencias)`:**
  * sin argumentos reutiliza el catálogo ya cargado;
  * si no hay catálogo, usa los gustos guardados o `PREFERENCIAS_POR_DEFECTO` (Ficción, Español);
  * con otros gustos vuelve a consultar a la API.
  * Una consulta en curso no se duplica ni pisa a una más nueva (`claveCatalogo`, `clavePendiente`).
* **Edición en el idioma elegido:** la obra original puede estar en otro idioma. Se piden las `editions` de la API y de ahí salen el título, la portada y la editorial.
* **Género e idioma de cada libro:** como la API ya filtró, se muestran los que eligió el lector.

## 3. Cambios en la pantalla
* **`ListadoView.vue`:**
  * Sin gustos guardados no se carga nada: se espera al quiz. Al terminarlo se llama a `cargarLibros()`.
  * Se sacaron los filtros de género, idioma y origen, que ya no tienen sentido: todos los libros comparten género e idioma.
  * Quedan editorial, años, páginas y estrellas.
* **`LibroCard.vue`:** el género se muestra solo en el detalle, y se agregó "🏷️ Género" a la ficha. Se quitó la etiqueta "📍 Argentina".
* **Código borrado:** `autoresArgentinos.js`, `ORIGEN_ARGENTINA`, `ORIGEN_OTROS` y `getGeneros()`.

## ✅ Tests
* **`tests/catalogo.test.js` (nuevo):** comprueba la URL armada, que no hay criterio de país, que se usa la edición en el idioma elegido, que se descartan los repetidos y que solo se vuelve a consultar con otros gustos.
* **`tests/busqueda.test.js`:** se sacó el filtro por idioma, que ahora lo hace la API.
* **`tests/origen.test.js`:** se borró junto con la función que probaba.

## ⚠️ Limitaciones
* El catálogo depende de que OpenLibrary tenga bien cargados el tema y el idioma de cada obra. Con géneros poco frecuentes pueden venir pocos libros.
* Cambiar los gustos hace una consulta nueva a la API (hasta 10 s de espera máxima).
* Los años del quiz filtran por la **primera publicación** de la obra, no por la edición que se muestra.
