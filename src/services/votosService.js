// =========================================================================
// Requerimiento: Feedback con Like / Dislike - Sol
// =========================================================================
// Sin backend todavía: los votos se guardan en localStorage (solo en este navegador).
// Estructura: { [claveLibro]: { [usuario]: { tipo: 'like' | 'dislike', fecha } } }
import { reactive } from "vue";
import { AuthService } from "./authService.js";

const CLAVE_STORAGE = "biblioteca_votos";

function leerVotos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || {};
  } catch {
    return {};
  }
}

function guardarVotos() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(votos));
  } catch {
    // Si el navegador bloquea el storage, los votos quedan solo en memoria.
  }
}

const votos = reactive(leerVotos());

export const VotosService = {
  // Contadores totales y puntaje neto de un libro
  contar(claveLibro) {
    const votosLibro = Object.values(votos[claveLibro] || {});
    const likes = votosLibro.filter((v) => v.tipo === "like").length;
    const dislikes = votosLibro.filter((v) => v.tipo === "dislike").length;
    return { likes, dislikes, neto: likes - dislikes };
  },

  // Voto del usuario logueado: 'like', 'dislike' o null
  votoDelUsuario(claveLibro) {
    const usuario = AuthService.usuario;
    if (!usuario) return null;
    return votos[claveLibro]?.[usuario.usuario]?.tipo || null;
  },

  // Un voto por usuario y libro. Repetir el mismo voto lo quita; el otro lo reemplaza.
  votar(claveLibro, tipo) {
    const usuario = AuthService.usuario;
    if (!usuario) {
      throw new Error("Necesitás iniciar sesión para votar.");
    }

    if (!votos[claveLibro]) votos[claveLibro] = {};

    if (votos[claveLibro][usuario.usuario]?.tipo === tipo) {
      delete votos[claveLibro][usuario.usuario];
    } else {
      votos[claveLibro][usuario.usuario] = { tipo, fecha: new Date().toISOString() };
    }

    guardarVotos();
  }
};
