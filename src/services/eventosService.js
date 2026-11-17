// =========================================================================
// Registro de interacciones para las métricas del dueño - Sol
// =========================================================================
// Por ahora solo se registran búsquedas: las que no encuentran nada muestran
// qué libros pide la gente y la librería no tiene. Se guardan en localStorage
// (solo este navegador), con un máximo para no llenar el espacio.
const CLAVE_EVENTOS = "biblioteca_eventos";
const MAX_EVENTOS = 300;
const LARGO_MINIMO = 3;

export function leerEventos() {
  try {
    const eventos = JSON.parse(localStorage.getItem(CLAVE_EVENTOS));
    return Array.isArray(eventos) ? eventos : [];
  } catch {
    return [];
  }
}

/**
 * Guarda una búsqueda. Las de menos de 3 letras no se guardan (todavía se está escribiendo).
 * @param {{ texto: string, resultados: number, usuario?: string | null, fecha?: Date }} busqueda
 */
export function registrarBusqueda({ texto, resultados, usuario = null, fecha = new Date() }) {
  const limpio = texto.trim().toLowerCase();
  if (limpio.length < LARGO_MINIMO) return;

  const evento = { tipo: "busqueda", texto: limpio, resultados, usuario, fecha: fecha.toISOString() };
  try {
    localStorage.setItem(CLAVE_EVENTOS, JSON.stringify([...leerEventos(), evento].slice(-MAX_EVENTOS)));
  } catch {
    // Sin espacio o storage bloqueado: la búsqueda funciona igual, solo no se mide.
  }
}
