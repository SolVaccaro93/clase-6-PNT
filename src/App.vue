<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/authStore.js";
import Telarana from "./components/Telarana.vue";

const router = useRouter();
const authStore = useAuthStore();

// Leemos el usuario reactivo y el rol desde el store de autenticación (Pinia)
const usuario = computed(() => authStore.usuario);
const esAdmin = computed(() => authStore.esAdmin); // getter: sin paréntesis

function cerrarSesion() {
  authStore.logout();
  router.push({ name: "inicio" });
}
</script>

<template>
  <div class="contenedor">
    <!-- Telaraña fija en la esquina superior izquierda de la página -->
    <Telarana class="telarana-pagina" />

    <header class="encabezado">
      <div class="barra-superior">
        <div class="titulo-area">
          <h1>
            <span class="titulo-emoji" aria-hidden="true">🎃</span>
            La Biblioteca <span class="titulo-destacado">Embrujada</span>
          </h1>
          <p>Buscá libros, mirá qué hechizos hay disponibles y retiralos en tu sucursal.</p>

          <!-- Murciélagos decorativos del encabezado -->
          <span class="murcielago murcielago-1" aria-hidden="true">🦇</span>
          <span class="murcielago murcielago-2" aria-hidden="true">🦇</span>
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
/* El contenido ocupa todo el ancho de la pantalla.
   El padding crece con el viewport (clamp: mínimo 16px, 3% del ancho,
   máximo 48px) para que en pantallas grandes no quede pegado a los bordes. */
.contenedor {
  width: 100%;
  padding: 24px clamp(16px, 3vw, 48px);
}

/* Telaraña de la esquina de la página.
   'fixed' la clava en la ventana: no se mueve al hacer scroll.
   'z-index: -1' la manda detrás del contenido, así nunca tapa el título
   (queda por delante de la niebla del body, que también está en -1, porque
   en caso de empate se pinta primero lo que aparece antes en el documento). */
.telarana-pagina {
  position: fixed;
  top: 0;
  left: 0;
  width: 150px;
  height: 150px;
  color: var(--color-border-light);
  opacity: 0.55;
  z-index: -1;
}

/* En pantallas chicas se achica, para no comerse el título */
@media (max-width: 600px) {
  .telarana-pagina {
    width: 90px;
    height: 90px;
  }
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

/* El contenedor del título es "relative" para poder ubicar los murciélagos
   encima con position: absolute */
.titulo-area {
  position: relative;
}

h1 {
  color: #ffffff;
  margin: 0 0 6px;
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.2;
}

/* "Embrujada" en naranja calabaza con un resplandor detrás */
.titulo-destacado {
  color: var(--color-accent);
  text-shadow: 0 0 18px color-mix(in srgb, var(--color-accent) 60%, transparent);
}

/* La calabaza late suavemente, como una vela adentro */
.titulo-emoji {
  display: inline-block;
  animation: latir 2.5s ease-in-out infinite;
}

@keyframes latir {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}

/* Murciélagos: revolotean arriba a la derecha del título */
.murcielago {
  position: absolute;
  top: -6px;
  font-size: 1rem;
  opacity: 0.75;
  pointer-events: none;      /* decorativos: no deben molestar al mouse */
  animation: revolotear 7s ease-in-out infinite;
}

.murcielago-1 {
  left: 62%;
}

/* El segundo arranca más tarde y tarda distinto, así no vuelan sincronizados */
.murcielago-2 {
  left: 78%;
  font-size: 0.8rem;
  animation-duration: 9s;
  animation-delay: -3s;
}

@keyframes revolotear {
  0%   { transform: translate(0, 0) rotate(0deg); }
  25%  { transform: translate(14px, -10px) rotate(8deg); }
  50%  { transform: translate(4px, 6px) rotate(-6deg); }
  75%  { transform: translate(-12px, -4px) rotate(5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
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
