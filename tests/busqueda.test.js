import { setActivePinia, createPinia } from "pinia";
import { test } from "node:test";
import assert from "node:assert/strict";

test("buscar filtra por editorial, idioma y rango de años", async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ docs: [
    { key: "/works/A", title: "Libro A", publisher: ["Anagrama"], language: ["spa"], first_publish_year: 1950 },
    { key: "/works/B", title: "Libro B", publisher: ["Penguin"], language: ["eng"], first_publish_year: 1990 },
    { key: "/works/C", title: "Libro C", publisher: ["Anagrama"], language: ["eng"], first_publish_year: 2010 },
    { key: "/works/D", title: "Libro D" }
  ] }) });
  setActivePinia(createPinia());
  const { BibliotecaService: biblioteca } = await import("../src/services/bibliotecaService.js");
  await biblioteca.cargarLibros();
  const titulos = (filtros) => biblioteca.buscar("", "", 0, null, filtros).map((l) => l.titulo);

  assert.deepEqual(biblioteca.getEditoriales(), ["Anagrama", "Editorial Planeta", "Penguin"]);
  assert.deepEqual(biblioteca.getIdiomas(), ["Español", "Inglés"]);
  assert.equal(titulos({}).length, 4);
  assert.deepEqual(titulos({ editorial: "Todas", idioma: "Todos" }).length, 4);
  assert.deepEqual(titulos({ editorial: "anagrama" }), ["Libro A", "Libro C"]);
  assert.deepEqual(titulos({ idioma: "Inglés" }), ["Libro B", "Libro C"]);
  assert.deepEqual(titulos({ editorial: "Anagrama", idioma: "Inglés" }), ["Libro C"]);
  assert.deepEqual(titulos({ anioDesde: 1990 }), ["Libro B", "Libro C"]);
  assert.deepEqual(titulos({ anioHasta: 1990 }), ["Libro A", "Libro B"]);
  assert.deepEqual(titulos({ anioDesde: 1960, anioHasta: 2000 }), ["Libro B"]);
  // "" es lo que deja v-model.number al borrar el campo: no filtra
  assert.equal(titulos({ anioDesde: "", anioHasta: "" }).length, 4);
});
