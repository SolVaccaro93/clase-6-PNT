// =========================================================================
// Requerimiento: Calificar libros con estrellas (votos por usuario)
// Store de Pinia: guarda qué puntaje le puso cada usuario a cada libro.
// Sigue el mismo estilo que authStore.js (setup store: state + getters + actions).
// =========================================================================
import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./authStore.js";
import { calcularPromedio, esPuntajeValido } from "../services/votosCalculo.js";

// Clave de localStorage. Estructura guardada:
//   { "/works/OL123W": { "lector": 5, "admin": 4.5 }, ... }
// La clave del libro es libro.clave (estable, viene de OpenLibrary) y NO libro.id,
// porque el id depende del orden en que llega la API y puede cambiar.
export const CLAVE_VOTOS = "biblioteca_votos";

// Lee los votos guardados. Si el JSON está roto o tiene valores raros,
// se descartan en vez de romper la app (localStorage lo puede editar cualquiera).
function leerVotos() {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_VOTOS) || "null");
    if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return {};

    const limpio = {};
    for (const [claveLibro, porUsuario] of Object.entries(crudo)) {
      if (!porUsuario || typeof porUsuario !== "object") continue;
      for (const [usuario, puntaje] of Object.entries(porUsuario)) {
        if (esPuntajeValido(puntaje)) {
          limpio[claveLibro] = { ...limpio[claveLibro], [usuario]: puntaje };
        }
      }
    }
    return limpio;
  } catch {
    return {};
  }
}

export const useVotosStore = defineStore("votos", () => {
  // STATE: { [claveLibro]: { [usuario]: puntaje } }
  const votos = ref(leerVotos());

  // Guarda primero en localStorage y recién después actualiza el estado:
  // si la persistencia falla, la pantalla no muestra un voto que no se guardó.
  function guardar(siguientes) {
    localStorage.setItem(CLAVE_VOTOS, JSON.stringify(siguientes));
    votos.value = siguientes;
  }

  // ACTION: el usuario logueado califica un libro (o cambia su voto: es 1 por libro).
  function votar(claveLibro, puntaje) {
    // El store de auth se pide ADENTRO de la función, igual que en bibliotecaService.
    const auth = useAuthStore();
    if (!auth.usuario) throw new Error("Iniciá sesión para calificar un libro.");
    if (!claveLibro) throw new Error("El libro no existe.");
    if (!esPuntajeValido(puntaje)) {
      throw new Error("La calificación va de 0,5 a 5, de a media estrella.");
    }

    guardar({
      ...votos.value,
      [claveLibro]: { ...votos.value[claveLibro], [auth.usuario.usuario]: puntaje }
    });
    return puntaje;
  }

  // Voto del usuario logueado para ese libro, o null si no votó (o no hay sesión).
  function miVoto(claveLibro) {
    const usuario = useAuthStore().usuario?.usuario;
    if (!usuario) return null;
    return votos.value[claveLibro]?.[usuario] ?? null;
  }

  // Promedio y cantidad de votos de usuarios para un libro.
  // Al leer votos.value adentro, quien lo use en un computed se actualiza solo.
  function resumenDe(libro) {
    const porUsuario = votos.value[libro.clave] || {};
    return calcularPromedio(libro.puntaje, Object.values(porUsuario));
  }

  // Puntaje que se muestra Y que usa el filtro de estrellas.
  function puntajeVigente(libro) {
    return resumenDe(libro).promedio;
  }

  // Borra todos los votos (para repetir la demo). Solo el admin.
  function reiniciar() {
    if (!useAuthStore().esAdmin) throw new Error("Solo un administrador puede reiniciar los votos.");
    guardar({});
  }

  return { votos, votar, miVoto, resumenDe, puntajeVigente, reiniciar };
});