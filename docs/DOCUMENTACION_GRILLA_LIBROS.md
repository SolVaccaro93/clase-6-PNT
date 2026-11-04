# Documentación Técnica: Grilla de Libros en Rombos

## 📌 Requerimiento
Cambiar cómo se ven los libros en la pestaña **Listado**: en vez de tarjetas, una grilla de portadas sobre rombos de colores, con el diseño de [Responsive CSS Grid - Books](https://codetap.org/project/responsive-css-grid-books-threejs/live-preview). Tenía que quedar armado como componente.

## 🖥️ Qué ve el usuario
* Cada libro es un **rombo de colores** con la portada adentro, como si estuviera guardada en un bolsillo: la franja en V de abajo tapa la parte inferior de la tapa.
* Los rombos se **encastran** entre sí: cada fila se superpone medio rombo con la de arriba y una fila sí y una no arranca corrida una columna.
* Al pasar el mouse, la portada **se inclina y asoma** del bolsillo. Además aparece el título y el autor.
* **Hacer clic en una portada lleva al detalle del libro**, donde se consulta el stock y se pide el préstamo.
* La búsqueda, el panel de filtros, los chips y el contador de resultados siguen igual que antes.

## ⚙️ Reglas de diseño
* **Columnas según el ancho del listado** (no de la pantalla):

  | Ancho del listado | Columnas | Libros por fila (aprox.) |
  |---|---|---|
  | Menos de 600px | 3 | 1 |
  | 600px a 899px | 5 | 2 |
  | 900px a 1199px | 7 | 3 |
  | 1200px a 1499px | 9 | 4 |
  | 1500px o más | 11 | 5 |

* **Colores:** se combinan amarillo, rosa, azul, verde y crema según la posición del libro (`nth-child`), igual que en el diseño original. No usan la paleta de la app.
* **Libros sin portada:** si un libro no tiene portada o la imagen no carga, se muestra una tapa con el título y el autor.
* **Accesibilidad:**
  * Cada portada es un link, así que se puede recorrer con `Tab`. La que tiene el foco se marca con un borde naranja y se inclina igual que con el mouse.
  * La imagen tiene texto alternativo: "Título, de Autor".
  * Si el sistema tiene las animaciones desactivadas, la portada no se anima.

## 🛠️ Cambios en el código

### 1. Componente nuevo: `src/components/GrillaLibros.vue`
* **Prop:** `libros` (array, obligatorio). Son los libros a mostrar, con el formato de `BibliotecaService`. Usa `id`, `titulo`, `autor` y `portada`.
* No consulta el service ni filtra: muestra lo que recibe. Por eso se puede reutilizar en otras vistas.
* Cada libro es un `<li>` con un `RouterLink` a la ruta `detalle`.
* Las portadas que fallan se guardan en `portadasFallidas`, para mostrar la tapa con el título en su lugar.

**Cómo funciona el CSS:**
* **El rombo** es el `::before` del `<li>`, recortado con `clip-path: polygon(...)`. Las franjas salen de dos `linear-gradient` en diagonal.
* **El bolsillo** es el `::after`, recortado en forma de V. Como va después de la portada en el HTML, se dibuja encima y tapa su parte de abajo.
* **El encastre** sale de que cada `<li>`:
  * ocupa 2 columnas;
  * es cuadrado (`padding-bottom: 100%`);
  * sube medio rombo (`margin-top: -50%`).

  El `<ul>` tiene un `padding-top` que compensa ese margen en la primera fila.
* **El corrimiento de filas** se logra mandando a la columna 2 al primer libro de cada fila par. Qué libro es depende de la cantidad de columnas: con 3 es el `2n`, con 5 el `4n-1`, con 7 el `6n-2`, y así.
* **Las columnas** se definen con *container queries* (`@container grilla-libros`). Si el listado está dentro de un espacio angosto, la grilla se adapta a ese espacio.
* **`isolation: isolate`** en el `<ul>`: los rombos tienen `z-index` negativo y, sin esto, quedarían escondidos detrás del fondo de la página.

### 2. `src/views/ListadoView.vue`
* La grilla de `LibroCard` se reemplaza por `<GrillaLibros :libros="librosFiltrados" />`.
* Se borró el estilo `.grilla`, que ya no se usaba.

## ⚠️ Limitaciones
* **En el listado ya no se puede pedir un libro ni ver su stock:** eso se hace desde el detalle (`DetalleView`), que sigue usando `LibroCard`.
* **La portada se ve chica** (43% del rombo). Con 3 columnas, en celular, mide unos 100px de ancho.
* **Hay espacio libre a los costados:** en las puntas de la grilla quedan triángulos sin rombo, como en el diseño original.
* **Los colores no siguen el tema:** si se cambia la paleta en `src/style.css`, la grilla no cambia. Para adaptarla hay que editar las variables `--amarillo`, `--rosa`, `--azul`, `--verde` y `--blanco` al principio del CSS de `GrillaLibros.vue`.
