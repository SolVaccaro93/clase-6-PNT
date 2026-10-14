# Documentación Técnica: Fecha de Devolución y Tardanza

## 📌 Requerimiento
Que cada usuario pueda ver, en **Mis préstamos**, cuántos días le quedan para devolver el libro o cuántos días lleva de atraso. Las fechas se calculan con un paquete de npm.

## 📦 Paquete utilizado: `date-fns`
```bash
npm install date-fns
```
Se eligió [`date-fns`](https://date-fns.org/) porque es liviano, se importan solo las funciones que se usan y trabaja con objetos `Date` nativos.

Funciones usadas:
| Función | Para qué |
|---|---|
| `parseISO` | Convierte `"2026-01-05"` (formato en que se guardan los préstamos) a `Date`. |
| `addDays` | Suma los días del préstamo a la fecha de retiro → fecha límite. |
| `differenceInCalendarDays` | Días entre la fecha límite y hoy (o la fecha de devolución). |
| `format` | Muestra la fecha límite como `yyyy-MM-dd`. |

## ⚙️ Regla de negocio
* Cada préstamo dura **14 días** (`DIAS_PRESTAMO`).
* **Fecha límite** = `fecha_retiro + 14 días`.
* **Días restantes** = `fecha límite − hoy`. Si el libro ya se devolvió, se compara contra `fecha_devolucion`.
* La fecha límite **no se guarda**: se calcula al mostrar. Así funciona también con los préstamos que ya existían en `localStorage`.

Mensajes que ve el usuario:
| Situación | Mensaje |
|---|---|
| Faltan días | `Te quedan N día(s) para devolverlo` (verde) |
| Es el último día | `Vence hoy` (verde) |
| Se pasó la fecha | `Atrasado N día(s)` (rojo) |
| Devuelto en término | `Devuelto a tiempo` (verde) |
| Devuelto tarde | `Devuelto con N día(s) de atraso` (rojo) |

## 🛠️ Cambios en el código

### 1. Archivo nuevo: `src/services/devolucionService.js`
Contiene toda la lógica de fechas. Expone `DIAS_PRESTAMO` (duración del préstamo; cambiarlo acá modifica toda la app) y `calcularVencimiento(prestamo, hoy)`.

```javascript
// ==========================================
// Fecha de devolución y tardanza (usa date-fns)
// ==========================================

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export const DIAS_PRESTAMO = 14;

/**
 * Calcula la fecha límite y cuánto falta (o cuánto se atrasó) un préstamo.
 * @param {{ fecha_retiro: string, fecha_devolucion: string | null }} prestamo
 * @param {Date} hoy Fecha de referencia (se puede pasar otra para tests)
 */
export function calcularVencimiento(prestamo, hoy = new Date()) {
  const limite = addDays(parseISO(prestamo.fecha_retiro), DIAS_PRESTAMO);
  const referencia = prestamo.fecha_devolucion ? parseISO(prestamo.fecha_devolucion) : hoy;
  const diasRestantes = differenceInCalendarDays(limite, referencia);

  return {
    fechaLimite: format(limite, "yyyy-MM-dd"),
    diasRestantes,
    atrasado: diasRestantes < 0,
    texto: textoVencimiento(diasRestantes, Boolean(prestamo.fecha_devolucion))
  };
}

function textoVencimiento(dias, devuelto) {
  if (devuelto) return dias < 0 ? `Devuelto con ${-dias} día(s) de atraso` : "Devuelto a tiempo";
  if (dias > 0) return `Te quedan ${dias} día(s) para devolverlo`;
  if (dias === 0) return "Vence hoy";
  return `Atrasado ${-dias} día(s)`;
}
```

**Cómo funciona, paso a paso:**
1. `parseISO("2026-01-05")` convierte la fecha de retiro guardada (texto) en un `Date`.
2. `addDays(..., 14)` le suma los días del préstamo → **fecha límite**.
3. Si el libro todavía no se devolvió, se compara contra **hoy**; si ya se devolvió, contra la **fecha de devolución** (para saber si se devolvió tarde).
4. `differenceInCalendarDays(limite, referencia)` da los días que faltan. Si da negativo, hay atraso.
5. `textoVencimiento` arma el mensaje que ve el usuario.

Ejemplo de lo que devuelve:
```javascript
{
  fechaLimite: "2026-01-19",
  diasRestantes: 9,      // negativo si está atrasado
  atrasado: false,
  texto: "Te quedan 9 día(s) para devolverlo"
}
```
El parámetro `hoy` tiene valor por defecto `new Date()`, pero se puede pasar otra fecha para probar la función.

### 2. Archivo modificado: `src/views/PrestamosView.vue`
Se importa el servicio nuevo:
```diff
 import { BibliotecaService } from "../services/bibliotecaService.js";
+import { calcularVencimiento, DIAS_PRESTAMO } from "../services/devolucionService.js";
```

En cada préstamo se muestra la fecha límite y el mensaje de días restantes / atraso. La clase `atrasado` se activa sola cuando corresponde:
```diff
-        <p>Retiro: {{ prestamo.fecha_retiro }}</p>
+        <p>Retiro: {{ prestamo.fecha_retiro }} · Vence: {{ calcularVencimiento(prestamo).fechaLimite }}</p>
+        <p class="vencimiento" :class="{ atrasado: calcularVencimiento(prestamo).atrasado }">
+          {{ calcularVencimiento(prestamo).texto }}
+        </p>
```

El texto de ayuda muestra la duración del préstamo usando la constante:
```diff
-    <p>Podés tener un libro activo. Al devolverlo pasa de leyendo a terminado.</p>
+    <p>Podés tener un libro activo durante {{ DIAS_PRESTAMO }} días. Al devolverlo pasa de leyendo a terminado.</p>
```
> Este texto se volvió a cambiar después al implementar múltiples préstamos (ver [DOCUMENTACION_MULTIPLES_PRESTAMOS.md](DOCUMENTACION_MULTIPLES_PRESTAMOS.md)).

Estilos: verde a tiempo, rojo con atraso.
```diff
 h3 { margin-top: 0; }
+.vencimiento { font-weight: bold; color: #a3be8c; }
+.vencimiento.atrasado { color: #bf616a; }
```

### 3. Archivo nuevo: `tests/devolucion.test.js`
Usa una fecha fija (`10/01/2026`) como "hoy" para que el test dé siempre el mismo resultado:

```javascript
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularVencimiento } from "../src/services/devolucionService.js";

const hoy = new Date(2026, 0, 10);

test("calcula días restantes, vencimiento y atraso", () => {
  const aTiempo = calcularVencimiento({ fecha_retiro: "2026-01-05", fecha_devolucion: null }, hoy);
  assert.equal(aTiempo.fechaLimite, "2026-01-19");
  assert.equal(aTiempo.diasRestantes, 9);
  assert.equal(aTiempo.atrasado, false);

  assert.equal(calcularVencimiento({ fecha_retiro: "2025-12-27", fecha_devolucion: null }, hoy).texto, "Vence hoy");

  const atrasado = calcularVencimiento({ fecha_retiro: "2025-12-20", fecha_devolucion: null }, hoy);
  assert.equal(atrasado.atrasado, true);
  assert.equal(atrasado.texto, "Atrasado 7 día(s)");

  const devuelto = calcularVencimiento({ fecha_retiro: "2026-01-01", fecha_devolucion: "2026-01-18" }, hoy);
  assert.equal(devuelto.texto, "Devuelto con 3 día(s) de atraso");
});
```

```bash
npm test
```

### 4. Archivo modificado: `package.json`
```diff
   "dependencies": {
+    "date-fns": "^4.4.0",
     "leaflet": "^1.9.4",
```
(`package-lock.json` también se actualizó automáticamente con `npm install`.)
