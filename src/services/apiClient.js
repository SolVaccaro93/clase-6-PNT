// Cliente HTTP del backend (server/). Agrega el token de sesión a cada pedido.
// La sesión vive en la tabla Sesiones de SQL Server; acá solo guardamos el token.
const CLAVE_TOKEN = "biblioteca_token";

export function getToken() {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}
export function setToken(token) {
  try { localStorage.setItem(CLAVE_TOKEN, token); } catch { /* sin storage: la sesión dura hasta recargar */ }
}
export function clearToken() {
  try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* nada que borrar */ }
}

export async function api(ruta, { method = "GET", body } = {}) {
  const token = getToken();
  const respuesta = await fetch(`/api${ruta}`, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.error || "Error al comunicarse con el servidor.");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

// Guarda en el servidor sin frenar la pantalla. Sin sesión no hace nada
// (así el servicio también funciona en los tests, sin backend).
export function guardarEnServidor(ruta, opciones) {
  if (!getToken()) return Promise.resolve(null);
  return api(ruta, opciones).catch((e) => {
    console.warn(`No se pudo guardar en el servidor (${ruta}):`, e.message);
    return null;
  });
}

// Los stores/servicios se registran acá para cargar sus datos desde la base
// cuando hay sesión (login o recarga de página).
const hidratadores = new Set();
export function alHidratar(fn) { hidratadores.add(fn); }
export async function hidratarDatos() {
  await Promise.all([...hidratadores].map((fn) => fn().catch((e) => console.warn("Hidratación:", e.message))));
}
