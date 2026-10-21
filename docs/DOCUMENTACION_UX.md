# Documentación Técnica: Mejoras de UI (paleta de colores + Bulma)

## 📌 Requerimiento
Mejorar la interfaz para que no se vea genérica, usando el framework **Bulma** y una **paleta de colores** propia.

Se hace **paso a paso**: cada paso es un cambio chico y entendible por separado. Este documento se va actualizando a medida que avanzamos.

## 🗺️ Plan de pasos

La idea es que **cada paso sea un solo concepto**, para poder explicarlo (y revisarlo) por separado. Los primeros son de diseño visual; Bulma entra recién en el Paso 6.

| Paso | Qué hace | Archivos | Estado |
|---|---|---|---|
| 1 | **Color**: paleta con variables CSS | `src/style.css` | ✅ Hecho |
| 2 | **Color**: pasar los componentes a usar las variables | `src/**/*.vue` | ✅ Hecho |
| 3 | **Forma**: escala de redondeos y sombras (que no se vea cuadrado) | `src/style.css` + componentes | ✅ Hecho |
| 4 | **Movimiento**: hover y transiciones (micro-interacciones) | `src/style.css` + componentes | ✅ Hecho |
| 4.5 | **Tema Halloween**: título, acento naranja y decoración | `index.html`, `App.vue`, `InicioView.vue`, `style.css`, `Telarana.vue` | ✅ Hecho |
| 5 | **Texto y aire**: jerarquía de títulos y espaciado | `src/style.css` + views | ⬜ Pendiente |
| 6 | **Bulma**: navbar en el header | `src/App.vue`, `src/main.js` | ⬜ Pendiente |
| 7 | **Bulma**: filtros y tarjetas con sus componentes | `ListadoView.vue`, `LibroCard.vue` | ⬜ Pendiente |
| 8 | **Estados**: carga y vacío más prolijos (skeletons) | `ListadoView.vue` | ⬜ Pendiente |

> `bulma` ya está instalado como dependencia (`package.json`), pero **todavía no está importado** en la app. Instalarlo no cambia nada visual: Bulma solo aplica estilos a los elementos que tienen sus clases (`navbar`, `button`, `card`, etc.). Se importa en el Paso 6.

### Por qué este orden

Lo que hace que una interfaz se vea "genérica" o "cuadrada" no es el framework, son cuatro cosas que se pueden trabajar por separado:

1. **Color** (pasos 1-2): si todo es gris con un azul por defecto, parece una plantilla.
2. **Forma** (paso 3): esquinas muy rectas y todo al mismo nivel se ve plano y duro.
3. **Movimiento** (paso 4): si nada responde al mouse, la página se siente "muerta".
4. **Texto y aire** (paso 5): sin jerarquía ni espacio, todo compite por la atención.

Bulma (pasos 6-7) aporta **componentes ya armados** (navbar responsive, formularios, grilla), no el estilo visual: eso lo define nuestra paleta y nuestra escala de formas.

---

## 🎨 La paleta: tema "Biblioteca antigua"

La idea del tema es un **violeta oscuro de fondo** con **vino** para lo que se puede clickear y **naranja calabaza** para los acentos, con texto crema (como el papel de un libro viejo). Es una combinación menos vista que el azul por defecto de la mayoría de los frameworks.

Todas las variables están en `:root`, en `src/style.css`.

**Fondos** (del más oscuro al más claro)

| Variable | Color | Uso |
|---|---|---|
| `--color-bg-deep` | `#140f1d` | El más oscuro: degradados |
| `--color-bg` | `#181221` | Fondo de la página (violeta muy oscuro) |
| `--color-bg-nested` | `#1d1628` | Cajas dentro de una tarjeta |
| `--color-surface` | `#241c35` | Fondo de tarjetas y paneles |
| `--color-surface-alt` | `#332943` | Chips, selects, fondos secundarios |

**Bordes**

| Variable | Color | Uso |
|---|---|---|
| `--color-border` | `#413455` | Bordes |
| `--color-border-light` | `#574867` | Bordes de inputs |
| `--color-border-hover` | `#4f4162` | Borde al pasar el mouse |

**Marca**

| Variable | Color | Uso |
|---|---|---|
| `--color-primary` | `#8c2f49` | Vino: botones y acciones principales |
| `--color-primary-hover` | `#a83c5a` | Vino más claro: hover de los botones |
| `--color-accent` | `#ff8c2b` | Naranja calabaza: links, foco y detalles |
| `--color-accent-light` | `#ffa857` | Naranja claro: hover de los acentos |

> El acento era dorado (`#d9a63e` / `#e0b65c`) en el tema "Biblioteca antigua" original. Pasó a naranja calabaza en el tema Halloween (Paso 4.5).

**Textos**

| Variable | Color | Uso |
|---|---|---|
| `--color-text` | `#f1e9dd` | Texto principal (crema) |
| `--color-text-light` | `#e6dced` | Títulos secundarios |
| `--color-text-muted` | `#cfc3dd` | Texto secundario |
| `--color-text-dim` | `#9b8caf` | Etiquetas chiquitas |

**Estados** (son semánticos: el nombre dice *para qué sirve*, no de qué color es)

| Variable | Color | Uso |
|---|---|---|
| `--color-success` | `#87a35e` | Verde oliva: disponible / éxito |
| `--color-danger` | `#c0394f` | Rojo: error / agotado |
| `--color-danger-soft` | `#d6793f` | Naranja: texto de los mensajes de error |
| `--color-gold` | `#e8c15c` | Dorado: puntajes y estrellas |
| `--color-rose` | `#b06a84` | Rosa viejo: iconos del feed |

El único color que quedó escrito a mano es `#ffffff` (blanco puro, para el texto sobre los botones de color), porque hacer una variable llamada "blanco" que valga blanco no aporta nada.

---

## 📐 La escala de formas

Mismo criterio que con el color: definidas una sola vez en `:root`, en `src/style.css`.

**Redondeos** — la regla es: *cuanto más grande el elemento, más grande el redondeo*.

| Variable | Valor | Uso |
|---|---|---|
| `--radio-chico` | `8px` | Chips, tags, inputs, botones |
| `--radio` | `14px` | Tarjetas y paneles |
| `--radio-grande` | `24px` | Bloques destacados (la bienvenida) |
| `--radio-pill` | `999px` | Píldoras: un valor enorme redondea los lados por completo |

**Sombras** — la regla es: *cuanto más "arriba" está el elemento, más grande y difusa la sombra*.

| Variable | Valor | Uso |
|---|---|---|
| `--sombra-chica` | `0 2px 8px rgba(0,0,0,.25)` | Tarjetas apoyadas en la página |
| `--sombra` | `0 8px 20px rgba(0,0,0,.35)` | Portadas, panel de login, hover de botones |
| `--sombra-grande` | `0 16px 40px rgba(0,0,0,.45)` | La bienvenida, portada destacada del detalle |

---

## ✅ Paso 1: paleta de colores con variables CSS

**Archivo:** `src/style.css` (único archivo tocado)

### Problema que resuelve
Los colores estaban escritos "a mano" (en hexadecimal) en cada regla CSS y repetidos en todos los componentes. Para cambiar un color había que buscarlo y reemplazarlo en muchos lugares.

### Qué se hizo

**1. Se agregó un bloque `:root` con la paleta.** `:root` es la raíz del documento HTML, así que las variables que se definen ahí quedan disponibles en toda la aplicación:

```css
:root {
  color-scheme: dark;

  --color-bg: #181221;      /* fondo de la página */
  --color-primary: #8c2f49; /* vino: botones */
  --color-accent: #d9a63e;  /* dorado: links */
  /* ...y el resto de la tabla de arriba */
}
```

**2. Se reemplazaron los hexadecimales por `var(--nombre)`** en las reglas que ya existían:

```css
/* Antes */
body {
  background-color: #1a1d24;
  color: #eceff4;
}

/* Ahora */
body {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

**3. Se unificó `color-scheme: dark`** dentro del mismo `:root` (antes había un `:root` suelto más abajo en el archivo).

No se agregó ninguna regla CSS nueva ni se cambió ningún layout: **solo cambian los colores**.

### Cómo se explica en una frase
> Antes el color estaba escrito a mano en cada regla. Ahora lo definimos una sola vez como variables CSS y las reglas lo referencian con `var(--color-primary)`. Para cambiar el tema de toda la app se editan esos valores y nada más.

### Cómo probar que funciona
1. `npm run dev`
2. Cambiar en `src/style.css` el valor de `--color-primary` por cualquier otro color (por ejemplo `#2e7d5b`) y guardar.
3. Todos los botones de la app cambian de color solos, sin tocar ningún componente.

### Estado después de este paso
Los `<style scoped>` de los componentes (`App.vue`, `LibroCard.vue`, las views...) **todavía tienen los colores viejos escritos a mano**, así que se ve una mezcla: el fondo, los botones y los links con la paleta nueva, pero el header y las tarjetas con el azul anterior. Eso se corrige en el Paso 2.

### Qué es una variable CSS (repaso rápido)
* Se declara con dos guiones: `--color-primary: #8c2f49;`
* Se usa con la función `var()`: `background-color: var(--color-primary);`
* Es CSS nativo, no necesita Sass ni ninguna herramienta extra.
* Se **hereda**: al declararla en `:root` la pueden usar todos los elementos, incluso dentro de los `<style scoped>` de los componentes de Vue (porque `scoped` limita a qué elementos aplican las reglas, pero no corta la herencia de variables).

---

## ✅ Paso 2: pasar los componentes a usar las variables

**Archivos:** `src/style.css` (se amplió la paleta) + los 13 componentes y views que tenían colores escritos a mano.

### Problema que resuelve
Después del Paso 1 la app se veía **mezclada**: el fondo y los botones con la paleta nueva, pero el header y las tarjetas con el azul viejo, porque cada componente tenía sus colores escritos a mano en su `<style scoped>`.

### Qué se hizo

**1. Se amplió la paleta.** Los componentes usaban 21 colores distintos y en el Paso 1 habíamos definido 9, así que se agregaron las variables que faltaban, agrupadas por categoría (fondos, bordes, marca, textos, estados). Ver la tabla de arriba.

**2. Se reemplazó cada color viejo por su variable**, siempre con la misma correspondencia en todos los archivos:

| Color viejo (tema Nord) | Variable nueva |
|---|---|
| `#1a1d24` | `var(--color-bg)` |
| `#242936` | `var(--color-surface)` |
| `#1e222d`, `#1f2430` | `var(--color-bg-nested)` |
| `#181b22` | `var(--color-bg-deep)` |
| `#2e3440` | `var(--color-surface-alt)` |
| `#3b4252` | `var(--color-border)` |
| `#4c566a` | `var(--color-border-light)` |
| `#434c5e` | `var(--color-border-hover)` |
| `#5e81ac` (azul) | `var(--color-primary)` (vino) |
| `#88c0d0` (celeste) | `var(--color-accent)` (dorado) |
| `#81a1c1` | `var(--color-accent-light)` |
| `#eceff4` | `var(--color-text)` |
| `#e5e9f0` | `var(--color-text-light)` |
| `#d8dee9` | `var(--color-text-muted)` |
| `#94a3b8` | `var(--color-text-dim)` |
| `#a3be8c` | `var(--color-success)` |
| `#bf616a` | `var(--color-danger)` |
| `#d08770` | `var(--color-danger-soft)` |
| `#ebcb8b` | `var(--color-gold)` |
| `#b48ead` | `var(--color-rose)` |

Son **198 reemplazos** en 13 archivos. No se tocó ni una sola propiedad que no sea de color: no cambió ningún `padding`, `display`, `grid` ni la estructura del HTML.

**3. Los colores con transparencia se pasaron a `color-mix()`.** Algunos fondos usaban `rgba(...)`, que no acepta una variable adentro. La solución es `color-mix()`, que mezcla un color con otro:

```css
/* Antes: el verde #a3be8c con 20% de opacidad, escrito en RGB */
background-color: rgba(163, 190, 140, 0.2);

/* Ahora: 20% del verde de la paleta y el resto transparente */
background-color: color-mix(in srgb, var(--color-success) 20%, transparent);
```

`in srgb` indica en qué espacio de color mezclar; es la opción que se comporta como uno espera. Es CSS nativo y funciona en todos los navegadores actuales.

### Detalles que no fueron un reemplazo automático

Tres cosas necesitaron criterio y vale la pena saberlas:

* **Degradados con transparencia.** `InicioView.vue` usaba `#1a1d2466` (un hexadecimal de **8** dígitos: los últimos 2 son la opacidad, `66` = 40%). Al reemplazar solo los primeros 6 dígitos quedaba `var(--color-bg)66`, que es CSS inválido y rompía la sombra. Se corrigió con `color-mix(in srgb, var(--color-bg) 40%, transparent)`.
* **Dos `:hover` de botones.** El botón "Ver catálogo" (Inicio) y "Ingresar" (Login) se aclaraban con el celeste viejo. Por el reemplazo automático quedaban dorados, distinto del resto de los botones de la app, así que se pusieron en `var(--color-primary-hover)` para que **todos los botones se comporten igual**.
* **Los chips de metadatos de la tarjeta.** Páginas, año y puntaje eran celeste, azul y dorado. Traducidos literalmente quedaban los tres en tonos dorados, que no se distinguían entre sí. Se repartieron: puntaje en `--color-gold`, páginas en `--color-rose` y año en `--color-text-dim`.

### Cómo se explica en una frase
> En toda la app no hay más colores escritos a mano: cada componente referencia la paleta. El tema entero se cambia desde `:root` en `src/style.css`.

### Cómo probar que funciona
1. `npm run dev`
2. Cambiar `--color-accent` en `src/style.css` por, digamos, `#4fb3bf`.
3. Cambian a la vez los links, el borde del foco, el panel admin, la ficha técnica y el nombre del autor en las portadas, **sin tocar ningún componente**.

Para verificar que no quedó nada afuera:

```bash
# No debería devolver nada más que #ffffff y el degradado del aro de "historias"
grep -rnoE '#[0-9a-fA-F]{3,8}' src/ --include=*.vue
```

### Verificación
* `npm run build` compila sin errores.
* `npm test` pasa los 2 tests (son de lógica de préstamos, no de estilos, pero confirma que no se rompió nada).

## ✅ Paso 3: formas — que no se vea cuadrado

**Archivos:** `src/style.css` (se agregó la escala) + 11 componentes y views.

### Problema que resuelve
Cada componente había elegido su propio redondeo **a ojo**: había 42 `border-radius` con 5 valores distintos (4, 6, 8, 10 y 20px) sin ninguna lógica, y las sombras estaban escritas con negros sueltos (`rgba(0,0,0,0.45)`, `0.6`, `0.25`...). Resultado: nada coincidía con nada y la mayoría de las cajas se veían rectas y planas.

### Qué se hizo

**1. Se definió la escala de formas** en `:root` (ver la tabla de arriba): 4 redondeos y 3 sombras, con una regla clara para elegir cuál usar.

**2. Se reemplazaron los 34 redondeos "a ojo"** por la escala:

| Valor viejo | Variable nueva |
|---|---|
| `4px`, `6px` | `var(--radio-chico)` (8px) |
| `8px`, `10px` | `var(--radio)` (14px) |

Se buscó `border-radius: 4px;` **con el punto y coma**, porque sin él se rompía el valor compuesto de la tapa del libro (`4px 10px 10px 4px`) al reemplazar solo el primer número.

**3. Los casos que necesitaron criterio** (no eran un reemplazo automático):

| Dónde | Antes | Ahora | Por qué |
|---|---|---|---|
| Etiqueta del feed, tag de admin, badge de rol | `20px` / `8px` | `var(--radio-pill)` | Son textos cortos en una cápsula: la píldora es la forma natural |
| Bloque de bienvenida (Inicio) | `20px` | `var(--radio-grande)` | Es el bloque más grande de la app |
| Tapa de texto del feed | `4px 10px 10px 4px` | `var(--radio-chico) var(--radio) var(--radio) var(--radio-chico)` | El redondeo asimétrico imita el lomo del libro; se mantuvo la idea pero con la escala |
| Avatares | `50%` | `50%` (sin cambios) | Un círculo no es parte de la escala |

**4. Las sombras pasaron a variables** y se les **agregó sombra a las tarjetas que no tenían**: las tarjetas de libro, las publicaciones del feed, las tarjetas de amigos y los bloques de estado (`.estado`). Esto es lo que más saca la sensación de "plano": antes las tarjetas eran un rectángulo con borde, ahora se apoyan sobre la página.

Dos `box-shadow` quedaron sin variable a propósito:
* Los anillos de los avatares del feed (`0 0 0 2px ...`): no son sombras, son bordes dobles dibujados con `box-shadow`.
* La sombra interna de la portada del detalle (`inset`): va para adentro, no proyecta.

### Cómo se explica en una frase
> Los redondeos y las sombras ya no se eligen a ojo en cada componente: hay una escala de 4 redondeos y 3 sombras, y se elige según el tamaño del elemento.

### Cómo probar que funciona
Cambiar `--radio` de `14px` a `4px` en `src/style.css`: **todas** las tarjetas, paneles y cajas de la app se vuelven cuadradas a la vez. Con `24px` se redondean todas juntas.

### Verificación
`npm run build` compila y `npm test` sigue en 2/2.

## ✅ Paso 4: movimiento (micro-interacciones)

**Archivos:** `src/style.css`, `LibroCard.vue`, `InicioView.vue`.

### Problema que resuelve
Nada reaccionaba al mouse: los botones cambiaban de color de golpe, las tarjetas no daban ninguna señal de ser clickeables y los inputs no mostraban dónde estabas escribiendo. Una interfaz que no responde se siente "muerta".

### Qué se hizo

**1. Dos variables de duración** en `:root` (misma idea que los colores y las formas):

| Variable | Valor | Uso |
|---|---|---|
| `--transicion-rapida` | `120ms ease` | Color de links y textos |
| `--transicion` | `200ms ease` | Botones, tarjetas, sombras |

Una `transition` hace que el cambio de estilo ocurra **de forma gradual** en vez de instantánea. La duración importa: menos de 100ms no se percibe, más de 300ms se siente lento.

**2. Estados interactivos** (lo que pasa al pasar el mouse o al hacer foco):

| Elemento | Qué hace ahora |
|---|---|
| Botones | Se aclaran, se levantan 1px y proyectan sombra; al hacer clic vuelven a su lugar (se "aprietan") |
| Tarjetas de libro | Se levantan 4px, la sombra crece y el borde se ilumina con el color de acento |
| Inputs y selects | El borde se aclara al pasar el mouse; en foco toman el color de acento con un halo alrededor |
| Links | Pasan al acento más claro (antes se volvían color crema, que los hacía parecer texto común) |

**3. Un solo bloque de accesibilidad.** Hay gente que tiene las animaciones desactivadas en su sistema operativo (por mareos, migrañas o preferencia). El navegador lo informa con `prefers-reduced-motion` y ahora lo atendemos **una vez** para toda la app, al final de `style.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    ...
  }
}
```

Los cambios de **color** siguen funcionando (la información visual no se pierde); lo que se corta es el **movimiento**. `InicioView.vue` tenía su propio bloque para esto: se borró, porque el global ya lo cubre.

### Cómo se explica en una frase
> Todo lo que se puede clickear ahora responde al mouse con un movimiento corto y consistente, y quien tenga las animaciones desactivadas en su sistema no ve ninguna.

### Cómo probar que funciona
Pasar el mouse por una tarjeta del listado (se levanta), por un botón (se levanta y toma sombra) y hacer clic en un input (aparece el halo naranja). Para probar la accesibilidad: en Windows, Configuración → Accesibilidad → Efectos visuales → desactivar "Efectos de animación"; al recargar, nada se mueve.

---

## ✅ Paso 4.5: tema Halloween 🎃

**Archivos:** `index.html`, `src/App.vue`, `src/views/InicioView.vue`, `src/style.css`, `src/components/Telarana.vue` (nuevo).

### Qué se hizo

**1. El título.** "Catálogo de Biblioteca" pasó a **"La Biblioteca Embrujada"**, en el `<title>` de `index.html` (lo que se ve en la pestaña del navegador) y en el `<h1>` de `App.vue`. Los textos de bienvenida también se reescribieron en clave de terror.

**2. El acento pasó de dorado a naranja calabaza.** Fue **un solo cambio de dos variables**, gracias a los pasos 1 y 2:

```css
--color-accent: #ff8c2b;        /* era #d9a63e (dorado) */
--color-accent-light: #ffa857;  /* era #e0b65c */
```

Con eso cambiaron a la vez los links, el borde de foco, los títulos de las fichas, el borde de las tarjetas en hover, el resplandor del título y la ilustración de Inicio (porque el SVG también usa las variables). Los valores viejos quedaron anotados en el comentario del código para poder volver al tema original.

**3. Ambiente: niebla y luna.** En `style.css`, un `body::before` con `position: fixed` y `z-index: -1` dibuja dos degradados detrás de todo el contenido: un resplandor naranja arriba a la derecha (la luna) y niebla violeta subiendo desde abajo. Al ser `fixed` no se mueve con el scroll, y al estar en un pseudo-elemento no afecta el layout de nada.

**4. Decoración animada:**

| Elemento | Dónde | Animación |
|---|---|---|
| 🎃 Calabaza | Junto al título | `latir`: escala 1 → 1.12 (como una vela adentro) |
| 🦇 Murciélagos (2) | Arriba del título | `revolotear`: se desplazan y rotan en un recorrido cerrado |
| 🕸️ Telaraña | Esquina superior izquierda de la página (fija al hacer scroll) | Fija, dibujada en SVG |
| 🕸️ Telarañas (2) | Esquinas del bloque de bienvenida | Fijas, dibujadas en SVG |
| 👻 Fantasma | Bienvenida, a la derecha | `flotar`: sube 14px y se desvanece a la mitad |

Detalles de implementación que importan:

* **Los dos murciélagos usan la misma animación** pero con `animation-duration` y `animation-delay` distintos. Sin eso volarían perfectamente sincronizados y se notaría el truco. El `animation-delay` negativo (`-3s`) arranca la animación como si ya hubiera empezado hace 3 segundos.
* **Las telarañas salieron a un componente, `Telarana.vue`**, porque se usan en tres lugares. El componente solo dibuja la figura: la posición, el tamaño y el color los define quien lo usa, con una clase propia (`.telarana-pagina` en `App.vue`, `.telarana-hero` en `InicioView.vue`). La figura apunta a la esquina superior izquierda; la de la derecha es la misma espejada con `transform: scaleX(-1)`.
* **El SVG usa `stroke="currentColor"`**, que significa "usá el color de texto que tengas". Así el color se define por CSS y sigue nuestra paleta en vez de estar fijo en el dibujo.
* **La telaraña de la página va con `position: fixed` y `z-index: -1`.** El `fixed` la clava en la ventana (no se mueve con el scroll) y el z-index negativo la manda detrás del contenido: sin eso tapaba el título, porque los elementos posicionados se pintan por encima de los que están en flujo normal. Queda por delante de la niebla del `body` (que también está en -1) porque, ante un empate de z-index, se pinta primero lo que aparece antes en el documento.
* **Todo lo decorativo lleva `aria-hidden="true"` y `pointer-events: none`**: los lectores de pantalla lo ignoran (no aporta información) y no interfiere con los clics.
* En pantallas chicas el fantasma se achica y se corre, porque tapaba la ilustración.
* Las animaciones se desactivan solas con `prefers-reduced-motion`, por el bloque del Paso 4.

### Cómo volver al tema original
Cambiar las dos variables de acento por los valores dorados y borrar los elementos decorativos del template (están todos marcados con comentarios y `aria-hidden`).

## ⬜ Paso 5: texto y aire
Pendiente. Jerarquía de títulos (tamaños y pesos coherentes), más espacio entre bloques y un ancho de lectura cómodo.

## ⬜ Paso 6: navbar de Bulma
Pendiente. Importar Bulma en `src/main.js` y reemplazar el header hecho a mano de `App.vue` por el componente `navbar` (que ya trae menú hamburguesa responsive).

## ⬜ Paso 7: filtros y tarjetas con Bulma
Pendiente. Usar `field` / `control` / `select` en los filtros del listado y `card` / `tag` / `button` en `LibroCard.vue`.

## ⬜ Paso 8: estados de carga y vacío
Pendiente. Reemplazar el texto "Cargando libros..." por *skeletons* (siluetas de tarjetas grises que laten) y darle una ilustración al estado "No se encontraron libros".
