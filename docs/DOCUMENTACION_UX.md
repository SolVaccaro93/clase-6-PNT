# Documentación Técnica: Mejoras de UI (paleta de colores + Bulma)

## 📌 Requerimiento
Mejorar la interfaz para que no se vea genérica, usando el framework **Bulma** y una **paleta de colores** propia.

Se hace **paso a paso**: cada paso es un cambio chico y entendible por separado. Este documento se va actualizando a medida que avanzamos.

## 🗺️ Plan de pasos

| Paso | Qué hace | Archivos | Estado |
|---|---|---|---|
| 1 | Paleta de colores con variables CSS | `src/style.css` | ✅ Hecho |
| 2 | Pasar los componentes a usar las variables | `src/**/*.vue` | ✅ Hecho |
| 3 | Navbar de Bulma en el header | `src/App.vue`, `src/main.js` | ⬜ Pendiente |
| 4 | Filtros y tarjetas con componentes de Bulma | `ListadoView.vue`, `LibroCard.vue` | ⬜ Pendiente |

> `bulma` ya está instalado como dependencia (`package.json`), pero **todavía no está importado** en la app. Instalarlo no cambia nada visual: Bulma solo aplica estilos a los elementos que tienen sus clases (`navbar`, `button`, `card`, etc.). Se importa en el Paso 3.

---

## 🎨 La paleta: tema "Biblioteca antigua"

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
| `--color-accent` | `#d9a63e` | Dorado: links, foco y detalles |
| `--color-accent-light` | `#e0b65c` | Dorado claro: hover de los acentos |

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

La idea del tema es un **violeta oscuro de fondo** con **vino** para lo que se puede clickear y **dorado** para los acentos, con texto crema (como el papel de un libro viejo). Es una combinación menos vista que el azul por defecto de la mayoría de los frameworks.

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

## ⬜ Paso 3: navbar de Bulma
Pendiente. Importar Bulma en `src/main.js` y reemplazar el header hecho a mano de `App.vue` por el componente `navbar` (que ya trae menú hamburguesa responsive).

## ⬜ Paso 4: filtros y tarjetas con Bulma
Pendiente. Usar `field` / `control` / `select` en los filtros del listado y `card` / `tag` / `button` en `LibroCard.vue`.
