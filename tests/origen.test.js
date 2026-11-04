import { setActivePinia, createPinia } from "pinia";
import { test } from "node:test";
import assert from "node:assert/strict";

const DOCS_GENERALES = [
  { key: "/works/G1", title: "General", author_name: ["Jane Austen"] },
  { key: "/works/AR1", title: "Ficciones", author_name: ["Jorge Luis Borges"] }
];

const DOCS_ARGENTINOS = [
  { key: "/works/AR1", title: "Ficciones", author_name: ["Jorge Luis Borges"] },
  { key: "/works/AR2", title: "El Aleph", author_name: ["Jorge Luis Borges"] },
  { key: "/works/AR3", title: "Otro de Borges", author_name: ["Jorge Luis Borges"] },
  { key: "/works/AR4", title: "Tercero de Borges", author_name: ["Jorge Luis Borges"] },
  { key: "/works/AR5", title: "El túnel", author_name: ["Ernesto Sábato"] },
  { key: "/works/X1", title: "Homónimo", author_name: ["Jorge Luis"] }
];

function prepararEntorno(fetchArgentinos) {
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  globalThis.fetch = async (url) => {
    if (decodeURIComponent(url).includes("author:(")) return fetchArgentinos();
    return { ok: true, json: async () => ({ docs: DOCS_GENERALES }) };
  };
  setActivePinia(createPinia());
}

test("suma libros de autores argentinos y permite filtrar por origen", async () => {
  prepararEntorno(() => ({ ok: true, json: async () => ({ docs: DOCS_ARGENTINOS }) }));
  const { BibliotecaService: biblioteca, ORIGEN_ARGENTINA, ORIGEN_OTROS } =
    await import("../src/services/bibliotecaService.js?origen=ok");
  await biblioteca.cargarLibros();
  const titulos = (origen) => biblioteca.buscar("", "", 0, null, { origen }).map((l) => l.titulo);

  // Generales primero; sin repetir Ficciones, con máximo 2 por autor y sin el homónimo.
  assert.deepEqual(titulos("Todos"), ["General", "Ficciones", "El Aleph", "El túnel"]);
  assert.deepEqual(titulos(ORIGEN_ARGENTINA), ["Ficciones", "El Aleph", "El túnel"]);
  assert.deepEqual(titulos(ORIGEN_OTROS), ["General"]);
});

test("si falla la consulta de argentinos, el catálogo carga igual", async () => {
  prepararEntorno(() => { throw new Error("Sin conexión"); });
  const { BibliotecaService: biblioteca } = await import("../src/services/bibliotecaService.js?origen=falla");
  const libros = await biblioteca.cargarLibros();
  assert.deepEqual(libros.map((l) => l.titulo), ["General", "Ficciones"]);
});
