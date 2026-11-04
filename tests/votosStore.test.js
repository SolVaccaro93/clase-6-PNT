import { setActivePinia, createPinia } from "pinia";
import { test } from "node:test";
import assert from "node:assert/strict";

// localStorage de mentira que SÍ guarda (para probar la persistencia)
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k)
};

const { useAuthStore } = await import("../src/stores/authStore.js");
const { useVotosStore, CLAVE_VOTOS } = await import("../src/stores/votosStore.js");

const libro = { clave: "/works/A", puntaje: 3.8 };

// Cada test arranca de cero: storage vacío y Pinia nueva
function arrancar() {
  memoria.clear();
  setActivePinia(createPinia());
  return { auth: useAuthStore(), votos: useVotosStore() };
}

test("sin sesión no se puede votar", () => {
  const { votos } = arrancar();
  assert.throws(() => votos.votar(libro.clave, 5), /Iniciá sesión/);
  assert.deepEqual(votos.resumenDe(libro), { promedio: 3.8, cantidad: 0 });
});

test("lector y admin votan y el promedio se actualiza", () => {
  const { auth, votos } = arrancar();
  auth.login("lector", "123");
  votos.votar(libro.clave, 5);
  assert.deepEqual(votos.resumenDe(libro), { promedio: 4.1, cantidad: 1 });

  auth.logout();
  auth.login("admin", "admin");
  votos.votar(libro.clave, 4.5);
  assert.deepEqual(votos.resumenDe(libro), { promedio: 4.2, cantidad: 2 });
});

test("cada usuario tiene un voto por libro y puede cambiarlo", () => {
  const { auth, votos } = arrancar();
  auth.login("lector", "123");
  votos.votar(libro.clave, 5);
  votos.votar(libro.clave, 3);
  assert.deepEqual(votos.resumenDe(libro), { promedio: 3.6, cantidad: 1 });
  assert.equal(votos.miVoto(libro.clave), 3);
});

test("miVoto devuelve null sin sesión o sin voto", () => {
  const { auth, votos } = arrancar();
  assert.equal(votos.miVoto(libro.clave), null);
  auth.login("lector", "123");
  assert.equal(votos.miVoto(libro.clave), null);
});

test("rechaza puntajes inválidos", () => {
  const { auth, votos } = arrancar();
  auth.login("lector", "123");
  [0, 5.5, 3.3, "4", NaN].forEach((p) => assert.throws(() => votos.votar(libro.clave, p), /media estrella/));
  assert.equal(votos.resumenDe(libro).cantidad, 0);
});

test("los votos sobreviven a una recarga (se leen de localStorage)", () => {
  const { auth, votos } = arrancar();
  auth.login("lector", "123");
  votos.votar(libro.clave, 5);
  assert.deepEqual(JSON.parse(memoria.get(CLAVE_VOTOS)), { "/works/A": { lector: 5 } });

  // "Recargar": Pinia nueva, pero el localStorage queda
  setActivePinia(createPinia());
  assert.deepEqual(useVotosStore().resumenDe(libro), { promedio: 4.1, cantidad: 1 });
});

test("si el localStorage tiene basura, la app no se rompe", () => {
  memoria.set(CLAVE_VOTOS, "{{ esto no es json");
  setActivePinia(createPinia());
  assert.deepEqual(useVotosStore().votos, {});

  memoria.set(CLAVE_VOTOS, JSON.stringify({ "/works/A": { lector: 99, admin: 4.5 }, "/works/B": "x" }));
  setActivePinia(createPinia());
  assert.deepEqual(useVotosStore().votos, { "/works/A": { admin: 4.5 } });
});

test("solo el admin puede reiniciar los votos", () => {
  const { auth, votos } = arrancar();
  auth.login("lector", "123");
  votos.votar(libro.clave, 5);
  assert.throws(() => votos.reiniciar(), /administrador/);
  assert.equal(votos.resumenDe(libro).cantidad, 1);

  auth.logout();
  auth.login("admin", "admin");
  votos.reiniciar();
  assert.deepEqual(votos.resumenDe(libro), { promedio: 3.8, cantidad: 0 });
  assert.equal(memoria.get(CLAVE_VOTOS), "{}");
});

test("el puntaje vigente es el que usa el filtro de estrellas", () => {
  const { auth, votos } = arrancar();
  assert.equal(votos.puntajeVigente(libro) >= 4, false); // 3,8 todavía no llega a 4
  auth.login("lector", "123");
  votos.votar(libro.clave, 5);
  assert.equal(votos.puntajeVigente(libro) >= 4, true); // 4,1 ya entra en "4 o más"
});