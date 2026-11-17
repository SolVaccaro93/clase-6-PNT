import { setActivePinia, createPinia } from "pinia";
import { test } from "node:test";
import assert from "node:assert/strict";

test("el catálogo se pide a la API filtrado por los gustos y sin criterio de país", async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(decodeURIComponent(url));
    return { ok: true, json: async () => ({ docs: [
      { key: "/works/A", title: "Sin portada" },
      { key: "/works/B", title: "Con portada", cover_i: 1, first_publish_year: 1980 },
      { key: "/works/B", title: "Repetido", cover_i: 2 },
      { key: "/works/C", title: "The Fellowship of the Ring", cover_i: 3,
        editions: { docs: [{ title: "La comunidad del anillo", language: ["eng"], publisher: ["Minotauro"], cover_i: 9 }] } }
    ] }) };
  };
  setActivePinia(createPinia());
  const { BibliotecaService: biblioteca } = await import("../src/services/bibliotecaService.js?catalogo");

  const libros = await biblioteca.cargarLibros({ genero: "Ciencia ficción", idioma: "Inglés", anioDesde: 1950, anioHasta: 2000 });

  assert.equal(urls.length, 1);
  assert.match(urls[0], /subject:"science fiction" AND language:eng AND first_publish_year:\[1950 TO 2000\]/);
  assert.doesNotMatch(urls[0], /author:/i);
  assert.deepEqual(libros.map((l) => l.titulo), ["Con portada", "La comunidad del anillo", "Sin portada"]);
  assert.equal(libros[1].editorial, "Minotauro");
  assert.match(libros[1].portada, /\/id\/9-M/);
  assert.ok(libros.every((l) => l.genero === "Ciencia ficción" && l.idioma === "Inglés"));

  // Sin pedir otros gustos se reutiliza el catálogo; con otros gustos se vuelve a consultar
  await biblioteca.cargarLibros();
  assert.equal(urls.length, 1);
  await biblioteca.cargarLibros({ genero: "Terror", idioma: "Español", anioDesde: 1950, anioHasta: 2000 });
  assert.equal(urls.length, 2);
});
