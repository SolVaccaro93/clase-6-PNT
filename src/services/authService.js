// =========================================================================
// Requerimiento: Login y sesión por usuario (con rol visita y admin) - Matías
// =========================================================================
import { reactive, computed } from "vue";

// Usuarios de prueba preconfigurados para facilitar la corrección y el uso
const USUARIOS_PREDEFINIDOS = [
  {
    usuario: "lector",
    clave: "123",
    nombre: "Sol Vaccaro",
    rol: "visita" // Rol común: puede ver catálogo, dar likes y pedir libros
  },
  {
    usuario: "admin",
    clave: "admin",
    nombre: "Matías Gratz",
    rol: "admin" // Rol administrador: tiene acceso al panel de gestión
  }
];

// Estado reactivo simple con Vue 3 (guarda el usuario en memoria y en localStorage)
const estado = reactive({
  usuarioActual: JSON.parse(localStorage.getItem("biblioteca_usuario") || "null")
});

export const AuthService = {
  // Retorna el usuario logueado actualmente o null
  get usuario() {
    return estado.usuarioActual;
  },

  // Indica si hay un usuario con sesión iniciada
  estaAutenticado() {
    return estado.usuarioActual !== null;
  },

  // Indica si el usuario actual tiene rol de administrador
  esAdmin() {
    return estado.usuarioActual?.rol === "admin";
  },

  // Iniciar sesión con usuario y contraseña
  login(username, password) {
    const usuarioEncontrado = USUARIOS_PREDEFINIDOS.find(
      (u) => u.usuario.toLowerCase() === username.trim().toLowerCase() && u.clave === password
    );

    if (!usuarioEncontrado) {
      throw new Error("Usuario o contraseña incorrectos.");
    }

    // Guardamos los datos del usuario en la sesión reactiva
    estado.usuarioActual = {
      usuario: usuarioEncontrado.usuario,
      nombre: usuarioEncontrado.nombre,
      rol: usuarioEncontrado.rol
    };

    // Persistimos en localStorage para que no se pierda al recargar la página
    localStorage.setItem("biblioteca_usuario", JSON.stringify(estado.usuarioActual));

    return estado.usuarioActual;
  },

  // Cerrar la sesión actual
  logout() {
    estado.usuarioActual = null;
    localStorage.removeItem("biblioteca_usuario");
  },

  // Lista de usuarios demo para mostrar ayuda en la pantalla de login
  obtenerUsuariosDemo() {
    return USUARIOS_PREDEFINIDOS;
  }
};
