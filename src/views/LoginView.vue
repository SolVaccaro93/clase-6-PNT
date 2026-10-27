<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const error = ref("");

// Si vino con redirección previa (ej: /login?redirect=/libros/2)
const destinoRedireccion = route.query.redirect || "/libros";

function procesarLogin() {
  error.value = "";
  try {
    authStore.login(username.value, password.value);
    // Redirige al destino previo exacto
    router.push(destinoRedireccion);
  } catch (e) {
    error.value = e.message || "Credenciales inválidas.";
  }
}

// Botones de acceso rápido para facilitar las pruebas del docente / evaluador
function entrarComo(usuarioDemo, claveDemo) {
  username.value = usuarioDemo;
  password.value = claveDemo;
  procesarLogin();
}
</script>

<template>
  <section class="login-contenedor" aria-labelledby="titulo-login">
    <div class="card-login">
      <div class="login-header">
        <span class="icono-candado">🔐</span>
        <h2 id="titulo-login">Iniciar Sesión</h2>
        <p v-if="route.query.redirect" class="aviso-redirect">
          Necesitás iniciar sesión para votar o solicitar un ejemplar. Luego volverás automáticamente adonde estabas.
        </p>
        <p v-else class="subtitulo">Ingresá a tu cuenta para gestionar tus lecturas.</p>
      </div>

      <form @submit.prevent="procesarLogin" class="form-login">
        <label class="campo">
          <span>Usuario</span>
          <input
            v-model="username"
            type="text"
            required
            placeholder="Ej: lector o admin"
            autocomplete="username"
          />
        </label>

        <label class="campo">
          <span>Contraseña</span>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Tu contraseña"
            autocomplete="current-password"
          />
        </label>

        <p v-if="error" class="mensaje error" role="alert">
          {{ error }}
        </p>

        <button type="submit" class="btn-ingresar">
          Entrar a la biblioteca
        </button>
      </form>

      <!-- Accesos rápidos para evaluación del TP -->
      <div class="seccion-demo">
        <p class="titulo-demo">💡 Cuentas de prueba para el TP:</p>
        <div class="botones-demo">
          <button
            type="button"
            class="btn-demo demo-visita"
            @click="entrarComo('lector', '123')"
          >
            👤 Lector (visita): <code>lector / 123</code>
          </button>
          <button
            type="button"
            class="btn-demo demo-admin"
            @click="entrarComo('admin', 'admin')"
          >
            🛡️ Administrador (admin): <code>admin / admin</code>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-contenedor {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.card-login {
  width: 100%;
  max-width: 440px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--sombra);
}

.login-header {
  text-align: center;
}

.icono-candado {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 6px;
}

.login-header h2 {
  margin: 0 0 6px;
  color: #ffffff;
  font-size: 1.5rem;
}

.subtitulo {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.aviso-redirect {
  margin: 8px 0 0;
  padding: 8px 12px;
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radio-chico);
  font-size: 0.85rem;
  color: var(--color-accent);
}

.form-login {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.btn-ingresar {
  margin-top: 8px;
  background-color: var(--color-primary);
  color: white;
  padding: 10px;
  border-radius: var(--radio-chico);
  font-size: 1rem;
}

.btn-ingresar:hover {
  background-color: var(--color-primary-hover);
}

.seccion-demo {
  background-color: var(--color-bg-nested);
  border: 1px dashed var(--color-border);
  border-radius: var(--radio-chico);
  padding: 14px;
}

.titulo-demo {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: var(--color-accent);
  font-weight: bold;
}

.botones-demo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-demo {
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border-light);
  color: var(--color-text);
  padding: 8px 12px;
  text-align: left;
  border-radius: var(--radio-chico);
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-demo:hover {
  background-color: var(--color-border);
  border-color: var(--color-accent);
}

.btn-demo code {
  color: var(--color-accent);
  font-size: 0.8rem;
}

.mensaje.error {
  margin: 0;
  padding: 8px 10px;
  background-color: color-mix(in srgb, var(--color-danger) 20%, transparent);
  color: var(--color-danger-soft);
  border: 1px solid var(--color-danger);
  border-radius: var(--radio-chico);
  font-size: 0.85rem;
}
</style>
