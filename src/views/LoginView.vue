<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { AuthService } from "../services/authService.js";

const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");
const error = ref("");

// Si vino con redirección previa (ej: /login?redirect=/libros/2)
const destinoRedireccion = route.query.redirect || "/libros";

function procesarLogin() {
  error.value = "";
  try {
    AuthService.login(username.value, password.value);
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
  background-color: #242936;
  border: 1px solid #3b4252;
  border-radius: 10px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
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
  color: #d8dee9;
  font-size: 0.9rem;
}

.aviso-redirect {
  margin: 8px 0 0;
  padding: 8px 12px;
  background-color: rgba(136, 192, 208, 0.15);
  border: 1px solid #88c0d0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #88c0d0;
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
  color: #d8dee9;
}

.btn-ingresar {
  margin-top: 8px;
  background-color: #5e81ac;
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-size: 1rem;
}

.btn-ingresar:hover {
  background-color: #81a1c1;
}

.seccion-demo {
  background-color: #1e222d;
  border: 1px dashed #3b4252;
  border-radius: 6px;
  padding: 14px;
}

.titulo-demo {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #88c0d0;
  font-weight: bold;
}

.botones-demo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-demo {
  background-color: #2e3440;
  border: 1px solid #4c566a;
  color: #eceff4;
  padding: 8px 12px;
  text-align: left;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-demo:hover {
  background-color: #3b4252;
  border-color: #88c0d0;
}

.btn-demo code {
  color: #88c0d0;
  font-size: 0.8rem;
}

.mensaje.error {
  margin: 0;
  padding: 8px 10px;
  background-color: rgba(191, 97, 106, 0.2);
  color: #d08770;
  border: 1px solid #bf616a;
  border-radius: 6px;
  font-size: 0.85rem;
}
</style>
