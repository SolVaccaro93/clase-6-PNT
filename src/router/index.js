import { createRouter, createWebHashHistory } from "vue-router";
import InicioView from "../views/InicioView.vue";
import ListadoView from "../views/ListadoView.vue";
import DetalleView from "../views/DetalleView.vue";
import NoEncontradoView from "../views/NoEncontradoView.vue";

export default createRouter({
  // El hash permite recargar cualquier pantalla sin configurar el servidor.
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "inicio", component: InicioView },
    { path: "/libros", name: "listado", component: ListadoView },
    { path: "/libros/:id", name: "detalle", component: DetalleView, props: true },
    { path: "/:pathMatch(.*)*", name: "no-encontrado", component: NoEncontradoView },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
