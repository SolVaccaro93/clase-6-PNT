<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { AuthService } from "./services/authService.js";

const router = useRouter();

// Leemos el usuario reactivo y el rol del AuthService
const usuario = computed(() => AuthService.usuario);
const esAdmin = computed(() => AuthService.esAdmin());

function cerrarSesion() {
  AuthService.logout();
  router.push({ name: "inicio" });
}
</script>

<template>
  <div class="contenedor">
    <header class="encabezado">
      <div class="barra-superior">
        <div>
          <h1>📚 Catálogo de Biblioteca</h1>
          <p>Buscá libros y consultá su disponibilidad por sucursal.</p>
        </div>

        <!-- Requerimiento: Autenticación y Sesión de usuario - Matías -->
        <div class="usuario-area">
          <div v-if="usuario" class="sesion-activa">
            <div class="datos-usuario">
              <span class="nombre-usuario">{{ usuario.nombre }}</span>
              <span class="badge-rol" :class="usuario.rol === 'admin' ? 'rol-admin' : 'rol-visita'">
                Rol: {{ usuario.rol }}
              </span>
            </div>
            <button class="btn-logout" @click="cerrarSesion" title="Cerrar sesión actual">
              Salir
            </button>
          </div>

          <div v-else class="sesion-inactiva">
            <RouterLink :to="{ name: 'login' }" class="btn-login-header">
              👤 Iniciar Sesión
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Navegación principal -->
      <nav aria-label="Navegación principal">
        <RouterLink :to="{ name: 'inicio' }">Inicio</RouterLink>
        <RouterLink :to="{ name: 'listado' }">Listado</RouterLink>

        <!-- Requerimiento: Panel y permisos diferenciados para administrador - Matías -->
        <RouterLink v-if="esAdmin" :to="{ name: 'admin' }" class="link-admin">
          ⚙️ Panel Admin
        </RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.contenedor {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}

.encabezado {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #3b4252;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.barra-superior {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

h1 {
  color: #ffffff;
  margin: 0 0 6px;
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.2;
}

.barra-superior p {
  margin: 0;
  color: #d8dee9;
}

.usuario-area {
  display: flex;
  align-items: center;
}

.sesion-activa {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #242936;
  border: 1px solid #3b4252;
  padding: 6px 12px;
  border-radius: 8px;
}

.datos-usuario {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.nombre-usuario {
  font-size: 0.85rem;
  font-weight: bold;
  color: #eceff4;
}

.badge-rol {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.rol-admin {
  background-color: #bf616a;
  color: white;
}

.rol-visita {
  background-color: #5e81ac;
  color: white;
}

.btn-logout {
  min-height: auto;
  padding: 6px 10px;
  font-size: 0.8rem;
  background-color: #3b4252;
  color: #d8dee9;
  border: 1px solid #4c566a;
  border-radius: 4px;
}

.btn-logout:hover {
  background-color: #bf616a;
  color: white;
}

.btn-login-header {
  display: inline-block;
  padding: 8px 14px;
  background-color: #3b4252;
  border: 1px solid #4c566a;
  border-radius: 6px;
  color: #eceff4;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-login-header:hover {
  background-color: #434c5e;
  border-color: #88c0d0;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

nav a {
  padding: 8px 16px;
  border: 1px solid #4c566a;
  border-radius: 6px;
  text-decoration: none;
  color: #d8dee9;
}

nav a.router-link-exact-active {
  background-color: #3b4252;
  color: #ffffff;
  border-color: #88c0d0;
}

.link-admin {
  border-color: #88c0d0;
  color: #88c0d0;
}
</style>