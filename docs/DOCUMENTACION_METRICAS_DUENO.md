# Documentación Técnica: Perfil del Dueño y Métricas del Negocio

## 📌 Requerimiento
Un perfil de **dueño de la librería** que pueda hacer todo lo del administrador y, además, ver métricas de préstamos e interacciones de los usuarios, con gráficos.

## 🧭 Decisiones
* **No hay ventas: se miden los préstamos.** La app es una biblioteca: los libros se prestan, no se venden.
* **El dueño es un rol aparte** (`dueno`), con su propio usuario de prueba. Puede hacer todo lo del admin (panel de stock, reiniciar votos) y es el único que ve **Métricas**.
* **Se registran las búsquedas, no las visitas.** Una búsqueda sin resultados le dice al dueño qué libros le piden y no tiene, que es información directa para decidir compras. Las visitas a páginas no llevan a ninguna decisión, así que no se miden.

## 👤 Acceso
| Usuario | Clave | Rol | Ve Métricas |
|---|---|---|---|
| `lector` | `123` | visita | No |
| `admin` | `admin` | admin | No |
| `duenolibreria` | `dueno` | dueño | Sí (`/#/metricas`) |

La ruta tiene `meta: { requiresDueno: true }`: quien no es dueño termina en el login.

## 📊 Qué muestra la pantalla
**Período:** 7, 30 o 90 días, contando hoy.

| Sección | Qué responde |
|---|---|
| Préstamos en el período, prestados ahora, atrasados | ¿Cuánto se mueve el catálogo? ¿Hay que reclamar libros? |
| Lectores activos | ¿Cuántas personas usan la librería? |
| Días promedio de lectura | ¿Cuánto tarda la gente en devolver? |
| Puntaje promedio y cantidad de votos | ¿Les gusta lo que leen? |
| **Qué conviene mirar** | Conclusiones armadas automáticamente: sucursal líder, libro más pedido, atrasados, qué reponer, qué falta |
| Préstamos por día (gráfico de columnas) | ¿Hay días o semanas con más movimiento? Tiene tooltip y se puede ver como tabla. |
| Préstamos por sucursal (barras) | ¿Qué sede rinde más? |
| Votos por cantidad de estrellas (barras) | ¿Cómo se reparten las calificaciones? |
| Libros más pedidos, lectores más activos, mejor valorados | Rankings (top 5) |
| Agotados para reponer | Libros sin stock en ninguna sucursal que alguien pidió, ordenados por pedidos |
| Buscados sin encontrar, más buscados | Qué busca la gente; lo primero sugiere qué sumar al catálogo |

Los votos de estrellas no tienen fecha, así que se cuentan todos, sin importar el período.

## 🧪 Datos de demostración
El botón **Ver con datos de demostración** muestra el panel con actividad inventada: 70 préstamos, votos y búsquedas. Se generan siempre iguales y **no se guardan**: no tocan el stock ni los préstamos reales. Sirven para presentar el panel cuando todavía no hubo actividad.

## 🛠️ Cambios en el código
| Archivo | Cambio |
|---|---|
| `src/stores/authStore.js` | Usuario `duenolibreria` con rol `dueno`. `esAdmin` también vale para el dueño; nuevo getter `esDueno`. |
| `src/router/index.js` | Ruta `/metricas` y regla `requiresDueno`. |
| `src/App.vue` | Link **📊 Métricas** y etiqueta "Rol: dueño". |
| `src/views/LoginView.vue` | Botón de acceso rápido del dueño. |
| `src/services/bibliotecaService.js` | `obtenerTodosLosPrestamos()`: préstamos de todos los usuarios. |
| `src/services/eventosService.js` (nuevo) | `registrarBusqueda()` y `leerEventos()`. Guarda hasta 300 búsquedas en `localStorage` (`biblioteca_eventos`). Las de menos de 3 letras no se guardan. |
| `src/views/ListadoView.vue` | Registra la búsqueda 1,5 segundos después de que el usuario deja de escribir, con la cantidad de resultados por texto. |
| `src/services/metricasService.js` (nuevo) | `calcularMetricas()` y `generarDatosDemo()`. Son funciones puras: reciben los datos y devuelven todo calculado. |
| `src/views/MetricasView.vue` (nuevo) | La pantalla. Los gráficos son HTML y CSS, sin librerías. |
| `tests/metricas.test.js` (nuevo) | Período, atrasados, rankings, votos, agotados, búsquedas, caso sin datos y demo. |

Para sumar una métrica: calcularla en `calcularMetricas` (con su test) y mostrarla en `MetricasView.vue`.

## ⚠️ Limitaciones
* **Los datos son de este navegador.** Préstamos, votos y búsquedas viven en `localStorage`: el dueño ve la actividad hecha en la misma máquina. Para ver la de todos hace falta un backend.
* **Los votos no tienen fecha**, así que no se filtran por período.
* **Los nombres** de los lectores salen de una lista fija (usuarios de prueba y amigos de demostración). Un usuario que no esté en ella se muestra con su identificador.
