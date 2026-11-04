import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const { BibliotecaService } = await import("../src/services/bibliotecaService.js?recomendaciones");

test("ordena los libros según cuántas preferencias coinciden y conserva el orden en empates", () => {
  const libros = [
    { titulo: "Solo género", genero: "Fantasía", idioma: "Inglés", anioPublicacion: 2010 },
    { titulo: "Coincidencia total", genero: "Fantasia", idioma: "Español", anioPublicacion: 1980 },
    { titulo: "Género e idioma", genero: "Fantasía", idioma: "Español", anioPublicacion: 2010 },
    { titulo: "Solo año", genero: "Poesía", idioma: "Inglés", anioPublicacion: 1990 },
    { titulo: "Año desconocido", genero: "Fantasía", idioma: "Español", anioPublicacion: "Clásico" }
  ];
  const preferencias = {
    genero: "Fantasía",
    idioma: "Español",
    anioDesde: 1950,
    anioHasta: 2000
  };

  const ordenados = BibliotecaService.ordenarPorPreferencias(libros, preferencias);

  assert.deepEqual(
    ordenados.map((libro) => libro.titulo),
    ["Coincidencia total", "Género e idioma", "Año desconocido", "Solo género", "Solo año"]
  );
  assert.equal(BibliotecaService.puntuarPreferencias(ordenados[0], preferencias), 3);
  assert.equal(BibliotecaService.puntuarPreferencias(ordenados[2], preferencias), 2);
});
