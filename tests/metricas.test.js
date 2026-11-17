import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMetricas, generarDatosDemo } from "../src/services/metricasService.js";

const HOY = new Date(2026, 10, 17); // 17/11/2026
const SUCURSALES = [{ id: 1, nombre: "Centro" }, { id: 2, nombre: "Floresta" }];
const LIBROS = [
  { id: 1, clave: "/works/A", titulo: "Rayuela", autor: "Julio Cortázar" },
  { id: 2, clave: "/works/B", titulo: "Ficciones", autor: "Jorge Luis Borges" }
];

const prestamo = (id, usuario, clave, titulo, sucursal, retiro, devolucion = null) => ({
  id_prestamo: id, id_usuario: usuario, clave_libro: clave, titulo, autor: "",
  id_sucursal: sucursal, sucursal: sucursal === 1 ? "Centro" : "Floresta",
  fecha_retiro: retiro, fecha_devolucion: devolucion
});

const PRESTAMOS = [
  prestamo("1", "lector", "/works/A", "Rayuela", 1, "2026-11-15", "2026-11-17"),
  prestamo("2", "pato", "/works/A", "Rayuela", 1, "2026-11-16"),
  prestamo("3", "lector", "/works/B", "Ficciones", 2, "2026-11-10"),
  // Retirado hace 20 días y sin devolver: atrasado (el préstamo dura 14)
  prestamo("4", "valen", "/works/B", "Ficciones", 1, "2026-10-28"),
  // Fuera de un período de 7 días
  prestamo("5", "valen", "/works/A", "Rayuela", 2, "2026-09-01", "2026-09-10")
];

test("calcula préstamos, atrasados y rankings del período", () => {
  const m = calcularMetricas({ prestamos: PRESTAMOS, libros: LIBROS, sucursales: SUCURSALES, dias: 7, hoy: HOY });

  assert.equal(m.kpis.prestamos, 2); // los del 15 y 16 de noviembre
  assert.equal(m.kpis.activos, 3);
  assert.equal(m.kpis.atrasados, 1);
  assert.equal(m.kpis.lectoresActivos, 2);
  assert.equal(m.kpis.diasDeLectura, 2);
  assert.equal(m.porDia.length, 7);
  assert.deepEqual(m.porDia.at(-2), { fecha: "2026-11-16", etiqueta: "16/11", cantidad: 1 });
  assert.deepEqual(m.porSucursal, [{ nombre: "Centro", cantidad: 2 }, { nombre: "Floresta", cantidad: 0 }]);
  assert.equal(m.topLibros[0].titulo, "Rayuela");
  assert.equal(m.topLibros[0].cantidad, 2);
});

test("resume los votos y los ubica por cantidad de estrellas", () => {
  const votos = { "/works/A": { lector: 5, pato: 3.5 }, "/works/B": { lector: 2 } };
  const m = calcularMetricas({ votos, libros: LIBROS, hoy: HOY });

  assert.equal(m.kpis.votos, 3);
  assert.equal(m.kpis.puntajePromedio, 3.5);
  // 3,5 sube a 4 estrellas
  assert.deepEqual(m.distribucionVotos.map((v) => v.cantidad), [0, 1, 0, 1, 1]);
  assert.deepEqual(m.mejorValorados.map((l) => l.titulo), ["Rayuela", "Ficciones"]);
});

test("detecta agotados con demanda y búsquedas sin resultados", () => {
  const eventos = [
    { tipo: "busqueda", texto: "harry potter", resultados: 0, fecha: new Date(2026, 10, 16).toISOString() },
    { tipo: "busqueda", texto: "harry potter", resultados: 0, fecha: new Date(2026, 10, 15).toISOString() },
    { tipo: "busqueda", texto: "borges", resultados: 1, fecha: new Date(2026, 10, 15).toISOString() },
    { tipo: "busqueda", texto: "viejo", resultados: 0, fecha: new Date(2026, 5, 1).toISOString() }
  ];
  const m = calcularMetricas({
    prestamos: PRESTAMOS,
    libros: LIBROS,
    eventos,
    stockTotalDe: (libro) => (libro.clave === "/works/A" ? 0 : 4),
    dias: 30,
    hoy: HOY
  });

  assert.deepEqual(m.agotadosConDemanda.map((l) => [l.titulo, l.pedidos]), [["Rayuela", 3]]);
  assert.equal(m.kpis.busquedas, 3);
  assert.deepEqual(m.busquedasSinResultados.map((b) => [b.clave, b.cantidad]), [["harry potter", 2]]);
  assert.ok(m.conclusiones.some((c) => c.includes("«Rayuela» está agotado")));
  assert.ok(m.conclusiones.some((c) => c.includes("«harry potter»")));
});

test("sin datos no hay errores y lo dice", () => {
  const m = calcularMetricas({ sucursales: SUCURSALES, hoy: HOY });

  assert.equal(m.kpis.prestamos, 0);
  assert.equal(m.kpis.diasDeLectura, null);
  assert.equal(m.kpis.puntajePromedio, null);
  assert.deepEqual(m.conclusiones, ["Todavía no hay préstamos en este período."]);
});

test("los datos de demostración son siempre iguales y alcanzan para todas las secciones", () => {
  const a = generarDatosDemo({ libros: LIBROS, sucursales: SUCURSALES, hoy: HOY });
  const b = generarDatosDemo({ libros: LIBROS, sucursales: SUCURSALES, hoy: HOY });
  assert.deepEqual(a, b);

  const m = calcularMetricas({ ...a, libros: LIBROS, sucursales: SUCURSALES, dias: 90, hoy: HOY });
  assert.ok(m.kpis.prestamos > 0);
  assert.ok(m.kpis.votos > 0);
  assert.ok(m.busquedasSinResultados.length > 0);
});
