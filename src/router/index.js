import { createRouter, createWebHashHistory } from "vue-router";
import { AuthService } from "../services/authService.js";
import InicioView from "../views/InicioView.vue";
import ListadoView from "../views/ListadoView.vue";
import DetalleView from "../views/DetalleView.vue";
import LoginView from "../views/LoginView.vue";
import AdminView from "../views/AdminView.vue";
import NoEncontradoView from "../views/NoEncontradoView.vue";
import SucursalesView from "../views/SucursalesView.vue";
import AmigosView from "../views/AmigosView.vue";

const router = createRouter({
  // El hash permite recargar cualquier pantalla sin configurar el servidor.
  history: createWebHashHistory(),
  routes: [
    // Requerimiento: Navegación abierta sin barrera de login al inicio - Matías
    { path: "/", name: "inicio", component: InicioView },
    { path: "/libros", name: "listado", component: ListadoView },
    { path: "/libros/:id", name: "detalle", component: DetalleView, props: true },

    // Requerimiento: Mapa de sucursales y vista 'Mis amigos' - Sol
    { path: "/sucursales", name: "sucursales", component: SucursalesView },
    { path: "/amigos", name: "amigos", component: AmigosView },

    // Requerimiento: Login y sesión por usuario - Matías
    { path: "/login", name: "login", component: LoginView },

    // Requerimiento: Panel y permisos diferenciados para administrador - Matías
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { requiresAdmin: true }
    },

    // 4. Ruta comodín para 404:
    { path: "/:pathMatch(.*)*", name: "no-encontrado", component: NoEncontradoView },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

// =========================================================================
// GUARDIA GLOBAL DE NAVEGACIÓN (Navigation Guard)
// =========================================================================
// Se ejecuta antes de entrar a CUALQUIER ruta.
// - to: ruta a la que intenta ir el usuario
// - from: ruta desde donde viene
// - next: función que autoriza o desvía la navegación
router.beforeEach((to, from, next) => {
  // Verificamos si la ruta exige rol de administrador
  if (to.meta.requiresAdmin) {
    if (!AuthService.esAdmin()) {
      // Si no es admin, lo mandamos al login guardando la ruta a la que intentaba ir
      next({ name: "login", query: { redirect: to.fullPath } });
      return;
    }
  }

  // Navegación abierta: si no tiene restricciones, se permite el acceso sin pedir login
  next();
});

export default router;
