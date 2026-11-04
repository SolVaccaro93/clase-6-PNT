# Documentación Técnica: Calificar Libros con Estrellas

## 📌 Requerimiento
Que los usuarios puedan **calificar un libro con estrellas** y que el promedio se actualice al instante, combinando el puntaje original de OpenLibrary con los votos de los usuarios de la app.

## 🖥️ Qué ve el usuario
En la tarjeta del **Listado** (`/#/libros`) y en el **Detalle** (`/#/libros/:id`), debajo del autor, hay una fila de estrellas:

`★★★★☆ 3,8 (2)`

* El número es el **promedio** y el paréntesis, la cantidad de **usuarios de la app** que votaron (arranca en 0; no cuenta las críticas de la API).
* Al **pasar el mouse** por las estrellas se ve una vista previa (de media en media estrella, de 0,5 a 5) y el texto cambia a "Calificar con 3,5".
* Al **hacer clic** se guarda el voto, el promedio cambia al instante y aparece "¡Gracias! Calificaste con 3,5.".
* Debajo de la fila se muestra "Tu voto: X" si el usuario ya votó ese libro.
* **Sin sesión**: la vista previa funciona igual, pero al hacer clic se redirige al login y, al ingresar, se vuelve al mismo lugar (`redirect`). Hay que volver a elegir las estrellas.
* **Teclado**: con Tab se llega a las estrellas; flechas = media estrella, `Home`/`End` = extremos, `1` a `5` = estrellas enteras, `Enter` o espacio = votar, `Esc` = cancelar.

En el **Panel Admin** hay un contador de "Votos de estrellas" y un botón **Reiniciar votos** (pide confirmación) para repetir la demo.

## ⚙️ Regla de negocio
* Cada usuario tiene **un voto por libro** y puede cambiarlo (el nuevo reemplaza al anterior).
* Un voto vale de **0,5 a 5**, en pasos de 0,5.
* El promedio es ponderado: el puntaje de la API cuenta como **3 votos fijos** (`PESO_PUNTAJE_API`), así un solo voto se nota.

```
promedio = (puntajeApi × 3 + suma de votos) / (3 + cantidad de votos)
```

Se redondea a **1 decimal** (mitad hacia arriba), igual que se muestra. Con un libro de 3,8:

| Voto | Nuevo puntaje |
|---|---|
| 5 | 4,1 |
| 4,5 | 4,0 |
| 3 | 3,6 |
| 1 | 3,1 |

Con dos usuarios (lector 5 y admin 4,5) queda en 4,2.

* El **filtro de estrellas** del Listado usa este puntaje nuevo (puntaje vigente), no el original de la API. Ver `DOCUMENTACION_FILTRO_ESTRELLAS.md`.
* Los votos se guardan en `localStorage` con la clave `biblioteca_votos`, así que sobreviven a recargar la página. Si el contenido está dañado o tiene valores inválidos, se descarta sin romper la app.

## 🛠️ Cambios en el código

### Archivos nuevos
| Archivo | Qué hace |
|---|---|
| `src/services/votosCalculo.js` | Lógica pura del promedio (`calcularPromedio`, `esPuntajeValido`, `formatearPuntaje`). No usa Vue ni Pinia. |
| `src/stores/votosStore.js` | Store de Pinia con los votos: `votar`, `miVoto`, `resumenDe`, `puntajeVigente`, `reiniciar`. |
| `src/components/EstrellasLibro.vue` | Componente que muestra el promedio y permite votar (mouse, toque y teclado). |
| `tests/votosCalculo.test.js` | Tests de la fórmula (incluye la tabla de arriba). |
| `tests/votosStore.test.js` | Tests del store: sesión, un voto por usuario, persistencia, datos dañados, reinicio. |

### Archivos modificados
* `src/services/bibliotecaService.js`: `buscar` compara `estrellasMinimas` contra `puntajeVigente(libro)`. El store solo se consulta cuando se filtra por estrellas.
* `src/components/LibroCard.vue`: incluye `<EstrellasLibro>` y se quitó el chip `⭐ 4.2 / 5` de la tarjeta (ahora lo muestran las estrellas). También se quitó el “Puntaje de la Crítica” de la ficha técnica del detalle, para que haya un único puntaje visible (el de las estrellas). El puntaje original de OpenLibrary sigue siendo la base del cálculo.
* `src/views/AdminView.vue`: contador de votos y botón **Reiniciar votos**.

### Decisiones
* Los votos se asocian a `libro.clave` (la clave de OpenLibrary) y no a `libro.id`, porque el id depende del orden en que responde la API.
* El store de auth se pide **dentro** de las funciones (no arriba del archivo), igual que en `bibliotecaService.js`, para que Pinia ya esté instalada.
* Solo el admin puede reiniciar los votos (se valida en el store, no solo ocultando el botón).
* No se usó una librería de estrellas externa: ninguna ofrecía vista previa con el mouse ni manejo de teclado.

## 🔄 Para repetir la demo
Panel Admin → **Reiniciar votos**, o desde DevTools: Application → Local Storage → borrar la clave `biblioteca_votos`.

## ✅ Cómo probarlo
```
npm test
```
