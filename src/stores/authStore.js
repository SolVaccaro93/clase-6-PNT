// =========================================================================
// Requerimiento: Login y sesión por usuario (con rol visita y admin)
// Store de Pinia: reemplaza al antiguo AuthService (services/authService.js)
// =========================================================================
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, clearToken, getToken, hidratarDatos, setToken } from "../services/apiClient.js";

// Copia local del usuario para mostrar la UI al instante al recargar.
// La sesión real (token) vive en la tabla Sesiones de SQL Server y se
// vuelve a validar con /api/auth/me al arrancar.
const CLAVE_SESION = "biblioteca_usuario";

// Usuarios de ayuda en la pantalla de login (los reales están en la base).
const USUARIOS_DEMO = [
  { usuario: "lector", clave: "123", nombre: "Sol Vaccaro", rol: "visita" },
  { usuario: "admin", clave: "admin", nombre: "Matías Gratz", rol: "admin" }
];

function leerUsuarioLocal() {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || "null"); } catch { return null; }
}

// defineStore recibe el id del store ("auth") y una función (setup store):
// todo lo que se declara adentro y se devuelve con return queda expuesto.
export const useAuthStore = defineStore("auth", () => {

  // ---------------------------------------------------------------------
  // STATE (antes: estado.usuarioActual)
  // Usuario logueado actualmente o null. Arranca leyendo localStorage para
  // que la sesión no se pierda al recargar la página.
  // ---------------------------------------------------------------------
  const usuario = ref(getToken() ? leerUsuarioLocal() : null);

  // ---------------------------------------------------------------------
  // GETTERS (antes: métodos estaAutenticado() y esAdmin())
  // Son computed: se recalculan solos cuando cambia "usuario".
  // Ahora se usan como propiedades, SIN paréntesis: auth.esAdmin
  // ---------------------------------------------------------------------

  // Indica si hay un usuario con sesión iniciada
  const estaAutenticado = computed(() => usuario.value !== null);
  // Indica si el usuario actual tiene rol de administrador.
  // El dueño también cuenta como admin: puede hacer todo lo del panel de gestión.
  const esAdmin = computed(() => usuario.value?.rol === "admin" || usuario.value?.rol === "dueno");
  // Indica si el usuario actual es el dueño de la librería (acceso a métricas)
  const esDueno = computed(() => usuario.value?.rol === "dueno");

   // ---------------------------------------------------------------------
  // ACTIONS (antes: métodos login(), logout() y obtenerUsuariosDemo())
  // Son funciones comunes. Dentro del store se accede al estado con .value
  // ---------------------------------------------------------------------

  // Iniciar sesión: el servidor valida la clave y crea la sesión en la base.
  async function login(username, password) {
    let datos;
    try {
      datos = await api("/auth/login", { method: "POST", body: { usuario: username.trim(), clave: password } });
    } catch (e) {
      if (e.status) throw e; // credenciales incorrectas
      throw new Error("No se pudo conectar con el servidor.");
    }
    setToken(datos.token);
    usuario.value = datos.usuario;
    try { localStorage.setItem(CLAVE_SESION, JSON.stringify(datos.usuario)); } catch { /* solo es una copia */ }
    await hidratarDatos();
    return usuario.value;
  }

  // Al abrir la app: si hay token guardado, pregunta al servidor si la sesión sigue vigente.
  let restauracion = null;
  function restaurarSesion() {
    restauracion ??= (async () => {
      if (!getToken()) { usuario.value = null; return; }
      try {
        const datos = await api("/auth/me");
        usuario.value = datos.usuario;
        await hidratarDatos();
      } catch (e) {
        // Sesión vencida o inválida (401): se limpia. Si el servidor no responde, se conserva la copia local.
        if (e.status === 401) cerrarLocal();
      }
    })();
    return restauracion;
  }

  function cerrarLocal() {
    usuario.value = null;
    clearToken();
    try { localStorage.removeItem(CLAVE_SESION); } catch { /* nada que borrar */ }
  }

  // Cerrar la sesión: se limpia al instante y se borra la fila de la tabla Sesiones.
  async function logout() {
    const habiaToken = getToken();
    const pedido = habiaToken ? api("/auth/logout", { method: "POST" }).catch(() => {}) : Promise.resolve();
    cerrarLocal();
    await pedido;
  }

  // Lista de usuarios demo para mostrar ayuda en la pantalla de login
  function obtenerUsuariosDemo() {
    return USUARIOS_DEMO;
  }

    // Todo lo que no se devuelva acá no es accesible desde afuera
  return { usuario, estaAutenticado, esAdmin, esDueno, login, logout, restaurarSesion, obtenerUsuariosDemo };
});