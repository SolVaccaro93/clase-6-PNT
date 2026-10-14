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
