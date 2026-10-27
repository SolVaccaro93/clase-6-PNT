// =========================================================================
// Requerimiento: Login y sesión por usuario (con rol visita y admin)
// Store de Pinia: reemplaza al antiguo AuthService (services/authService.js)
// =========================================================================
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// Clave con la que se guarda la sesión en localStorage
const CLAVE_SESION = "biblioteca_usuario";

// Usuarios de prueba preconfigurados para facilitar la corrección y el uso.
// Es una constante fija (no cambia nunca), por eso queda afuera del store
// y no necesita ser reactiva.
const USUARIOS_PREDEFINIDOS = [
  {
    usuario: "lector",
    clave: "123",
    nombre: "Sol Vaccaro",
    rol: "visita" // Rol común: puede ver catálogo y pedir libros
  },
  {
    usuario: "admin",
    clave: "admin",
    nombre: "Matías Gratz",
    rol: "admin" // Rol administrador: tiene acceso al panel de gestión
  }
];

// defineStore recibe el id del store ("auth") y una función (setup store):
// todo lo que se declara adentro y se devuelve con return queda expuesto.
export const useAuthStore = defineStore("auth", () => {

  // ---------------------------------------------------------------------
  // STATE (antes: estado.usuarioActual)
  // Usuario logueado actualmente o null. Arranca leyendo localStorage para
  // que la sesión no se pierda al recargar la página.
  // ---------------------------------------------------------------------
  const usuario = ref(JSON.parse(localStorage.getItem(CLAVE_SESION) || "null"));

  // ---------------------------------------------------------------------
  // GETTERS (antes: métodos estaAutenticado() y esAdmin())
  // Son computed: se recalculan solos cuando cambia "usuario".
  // Ahora se usan como propiedades, SIN paréntesis: auth.esAdmin
  // ---------------------------------------------------------------------

  // Indica si hay un usuario con sesión iniciada
  const estaAutenticado = computed(() => usuario.value !== null);
  // Indica si el usuario actual tiene rol de administrador
  const esAdmin = computed(() => usuario.value?.rol === "admin");

   // ---------------------------------------------------------------------
  // ACTIONS (antes: métodos login(), logout() y obtenerUsuariosDemo())
  // Son funciones comunes. Dentro del store se accede al estado con .value
  // ---------------------------------------------------------------------

  // Iniciar sesión con usuario y contraseña
  function login(username, password) {
    const usuarioEncontrado  = USUARIOS_PREDEFINIDOS.find(
      (u) => u.usuario.toLowerCase() === username.trim().toLowerCase() && u.clave === password
    );
    if (!usuarioEncontrado) throw new Error("Usuario o contraseña incorrectos.");

   // Guardamos los datos del usuario en el estado (sin la clave)
    usuario.value = {
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre,
      rol: usuarioEncontrado.rol
    };

    // Persistimos en localStorage para que no se pierda al recargar la página
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario.value));

    return usuario.value;
  }

    // Cerrar la sesión actual
  function logout() {
    usuario.value = null;
    localStorage.removeItem(CLAVE_SESION);
  }

    // Lista de usuarios demo para mostrar ayuda en la pantalla de login
  function obtenerUsuariosDemo() {
    return USUARIOS_PREDEFINIDOS;
  }

    // Todo lo que no se devuelva acá no es accesible desde afuera
  return { usuario, estaAutenticado, esAdmin, login, logout, obtenerUsuariosDemo };
});