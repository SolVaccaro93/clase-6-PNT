import { test } from "node:test";
import assert from "node:assert/strict";

test("retiro y devolución mantienen stock, usuario, estados y persistencia", async () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ docs: [
    { key: "/works/A", title: "Libro A" },
    { key: "/works/B", title: "Libro B" }
  ] }) });
  const { AuthService } = await import("../src/services/authService.js");
  const { BibliotecaService: biblioteca, cambiosStock } = await import("../src/services/bibliotecaService.js");
  await biblioteca.cargarLibros();
  const cantidad = () => biblioteca.consultarDisponibilidad(2)[0].cantidad;
  const original = cantidad();
  assert.throws(() => biblioteca.retirar(2, 1), /sesión/);
  AuthService.login("lector", "123");
  assert.throws(() => biblioteca.retirar(99, 1), /no existen/);
  assert.throws(() => biblioteca.retirar(2, 99), /no existen/);
  assert.throws(() => biblioteca.retirar(1, 1), /stock/);
  assert.equal(cantidad(), original);
  const persistir = localStorage.setItem;
  localStorage.setItem = () => { throw new Error("Sin espacio"); };
  assert.throws(() => biblioteca.retirar(2, 1), /Sin espacio/);
  assert.equal(cantidad(), original);
  assert.equal(biblioteca.obtenerPrestamoActivo(), null);
  localStorage.setItem = persistir;
  const prestamo = biblioteca.retirar(2, 1);
  assert.equal(prestamo.estado_lectura, "leyendo");
  assert.equal(cantidad(), original - 1);
  localStorage.setItem = () => { throw new Error("Sin espacio"); };
  assert.throws(() => biblioteca.devolver(prestamo.id_prestamo), /Sin espacio/);
  assert.equal(cantidad(), original - 1);
  assert.equal(biblioteca.obtenerPrestamoActivo().estado_lectura, "leyendo");
  localStorage.setItem = persistir;
  assert.throws(() => biblioteca.retirar(2, 1), /activo/);
  assert.throws(() => biblioteca.retirar(1, 2), /activo/);
  assert.equal(cantidad(), original - 1);
  AuthService.logout();
  assert.throws(() => biblioteca.devolver(prestamo.id_prestamo), /sesión/);
  AuthService.login("admin", "admin");
  assert.equal(biblioteca.obtenerPrestamoActivo(), null);
  assert.throws(() => biblioteca.devolver(prestamo.id_prestamo), /tuyo/);
  AuthService.login("lector", "123");
  const { BibliotecaService: recargada } = await import("../src/services/bibliotecaService.js?recarga");
  // El orden de la API puede cambiar: el stock se identifica por la clave estable.
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ docs: [
    { key: "/works/B", title: "Libro B" },
    { key: "/works/A", title: "Libro A" }
  ] }) });
  await recargada.cargarLibros();
  assert.equal(recargada.consultarDisponibilidad(1)[0].cantidad, original - 1);
  assert.equal(recargada.obtenerPrestamoActivo().id_prestamo, prestamo.id_prestamo);
  const terminado = recargada.devolver(prestamo.id_prestamo);
  assert.equal(terminado.estado_lectura, "terminado");
  assert.ok(terminado.fecha_devolucion);
  assert.equal(recargada.consultarDisponibilidad(1)[0].cantidad, original);
  assert.throws(() => recargada.devolver(prestamo.id_prestamo), /ya fue devuelto/);
  assert.equal(recargada.consultarDisponibilidad(1)[0].cantidad, original);
  assert.equal(recargada.obtenerPrestamoActivo(), null);
  recargada.retirar(1, 1);
  const revision = cambiosStock.value;
  biblioteca.actualizarStock(2, 1, 1);
  assert.equal(cambiosStock.value, revision + 1);
});
