import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularPromedio,
  esPuntajeValido,
  formatearPuntaje,
  PESO_PUNTAJE_API
} from "../src/services/votosCalculo.js";

test("el puntaje de la API cuenta como 3 votos fijos", () => {
  assert.equal(PESO_PUNTAJE_API, 3);
});

test("sin votos de usuarios el promedio es el de la API", () => {
  assert.deepEqual(calcularPromedio(3.8, []), { promedio: 3.8, cantidad: 0 });
  assert.deepEqual(calcularPromedio(3.8), { promedio: 3.8, cantidad: 0 });
});

test("un solo voto sobre un 3,8 da los valores de la tabla de la demo", () => {
  assert.equal(calcularPromedio(3.8, [5]).promedio, 4.1);
  assert.equal(calcularPromedio(3.8, [4.5]).promedio, 4.0);
  assert.equal(calcularPromedio(3.8, [3]).promedio, 3.6);
  assert.equal(calcularPromedio(3.8, [1]).promedio, 3.1);
});

test("con dos usuarios (lector 5 y admin 4,5) queda en 4,2", () => {
  assert.deepEqual(calcularPromedio(3.8, [5, 4.5]), { promedio: 4.2, cantidad: 2 });
});

test("redondea la mitad hacia arriba sin errores de coma flotante", () => {
  // (3,8*3 + 4,5) / 4 = 3,975 -> 4,0
  assert.equal(calcularPromedio(3.8, [4.5]).promedio, 4.0);
});

test("ignora votos inválidos", () => {
  assert.deepEqual(calcularPromedio(3.8, [0, 6, 3.3, NaN, "5", null, 5]), { promedio: 4.1, cantidad: 1 });
});

test("sin puntaje de la API, el promedio sale solo de los votos", () => {
  assert.deepEqual(calcularPromedio(null, [4, 5]), { promedio: 4.5, cantidad: 2 });
  assert.deepEqual(calcularPromedio(null, []), { promedio: 0, cantidad: 0 });
});

test("esPuntajeValido acepta de 0,5 a 5 de a media estrella", () => {
  [0.5, 1, 2.5, 4.5, 5].forEach((p) => assert.equal(esPuntajeValido(p), true));
  [0, 5.5, -1, 3.3, "4", NaN, Infinity, null].forEach((p) => assert.equal(esPuntajeValido(p), false));
});

test("formatearPuntaje usa coma y un decimal", () => {
  assert.equal(formatearPuntaje(3.8), "3,8");
  assert.equal(formatearPuntaje(4), "4,0");
});