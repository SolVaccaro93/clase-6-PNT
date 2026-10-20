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
        <RouterLink :to="{ name: 'sucursales' }">Sucursales</RouterLink>
        <RouterLink :to="{ name: 'amigos' }">Mis amigos</RouterLink>
        <RouterLink v-if="usuario" :to="{ name: 'prestamos' }">Mis préstamos</RouterLink>

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
  border-bottom: 1px solid var(--color-border);
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
  color: var(--color-text-muted);
}

.usuario-area {
  display: flex;
  align-items: center;
}

.sesion-activa {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 6px 12px;
  border-radius: var(--radio);
}

.datos-usuario {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.nombre-usuario {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--color-text);
}

.badge-rol {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: var(--radio-pill);
  text-transform: uppercase;
  font-weight: 600;
}

.rol-admin {
  background-color: var(--color-danger);
  color: white;
}

.rol-visita {
  background-color: var(--color-primary);
  color: white;
}

.btn-logout {
  min-height: auto;
  padding: 6px 10px;
  font-size: 0.8rem;
  background-color: var(--color-border);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radio-chico);
}

.btn-logout:hover {
  background-color: var(--color-danger);
  color: white;
}

.btn-login-header {
  display: inline-block;
  padding: 8px 14px;
  background-color: var(--color-border);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radio-chico);
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-login-header:hover {
  background-color: var(--color-border-hover);
  border-color: var(--color-accent);
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

nav a {
  padding: 8px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radio-chico);
  text-decoration: none;
  color: var(--color-text-muted);
}

nav a.router-link-exact-active {
  background-color: var(--color-border);
  color: #ffffff;
  border-color: var(--color-accent);
}

.link-admin {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
