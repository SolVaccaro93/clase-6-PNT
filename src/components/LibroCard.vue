<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { BibliotecaService, cambiosStock } from "../services/bibliotecaService.js";
import { AuthService } from "../services/authService.js";
import VotoLibro from "./VotoLibro.vue";

const props = defineProps({
  libro: Object,
  mostrarDetalle: { type: Boolean, default: true }
});

const router = useRouter();
const route = useRoute();

// Variables reactivas
const disponibilidad = ref([]);
const sucursalSeleccionada = ref("");
const mensajeExito = ref("");
const mensajeError = ref("");
const prestamoActivo = computed(() => BibliotecaService.obtenerPrestamoActivo());
const prestamoDelLibro = computed(() => prestamoActivo.value?.clave_libro === props.libro.clave ? prestamoActivo.value : null);

// Consulta la disponibilidad al service
function cargarDisponibilidad() {
  try {
    disponibilidad.value = BibliotecaService.consultarDisponibilidad(props.libro.id);
  } catch (error) {
    mensajeError.value = "Error al consultar disponibilidad.";
  }
}

// =========================================================================
// Requerimiento: Redirección al login con retorno exacto - Matías
// =========================================================================
function solicitar() {
  mensajeExito.value = "";
  mensajeError.value = "";

  // Si el usuario no ha iniciado sesión, lo redirigimos al Login
  // pasándole como parámetro 'redirect' la ruta exacta donde está ahora
  if (!AuthService.estaAutenticado()) {
    router.push({
      name: "login",
      query: { redirect: route.fullPath }
    });
    return;
  }

  if (!sucursalSeleccionada.value) {
    mensajeError.value = "Por favor, seleccioná una sucursal.";
    return;
  }

  try {
    const prestamo = BibliotecaService.retirar(props.libro.id, Number(sucursalSeleccionada.value));
    mensajeExito.value = `Retiraste tu ejemplar en ${prestamo.sucursal}. Estado: leyendo.`;
  } catch (error) {
    mensajeError.value = error.message;
  }
}

function devolver() {
  mensajeExito.value = "";
  mensajeError.value = "";
  try {
    BibliotecaService.devolver(prestamoDelLibro.value.id_prestamo);
    mensajeExito.value = "Libro devuelto. Estado: terminado. El ejemplar vuelve a estar disponible.";
  } catch (error) {
    mensajeError.value = error.message;
  }
}

watch([cambiosStock, () => props.libro.id], cargarDisponibilidad, { immediate: true });
</script>

<template>
  <div class="card">
    <span class="genero">{{ libro.genero }}</span>
    <h2>{{ libro.titulo }}</h2>
    <p class="autor">Autor: {{ libro.autor }}</p>
    <VotoLibro :libro="libro" />
    <RouterLink v-if="mostrarDetalle" :to="{ name: 'detalle', params: { id: libro.id } }">
      Ver detalle<span class="sr-only"> de {{ libro.titulo }}</span> →
    </RouterLink>

    <!-- Disponibilidad por sucursal -->
    <div class="disponibilidad">
      <p><strong>Disponibilidad:</strong></p>
      <ul>
        <li v-for="item in disponibilidad" :key="item.sucursal.id">
          {{ item.sucursal.nombre }}:
          <span :class="item.cantidad > 0 ? 'con-stock' : 'sin-stock'">
            {{ item.cantidad > 0 ? item.cantidad + ' disponibles' : 'Agotado' }}
          </span>
        </li>
      </ul>
    </div>

    <!-- Interacción de Solicitar (con protección de login on-demand) -->
    <div v-if="prestamoDelLibro" class="acciones">
      <p>Estado: <strong>leyendo</strong> ? Retirado en {{ prestamoDelLibro.sucursal }}</p>
      <button @click="devolver">Devolver y terminar</button>
    </div>
    <p v-else-if="prestamoActivo" role="status">
      Ya ten?s un libro activo: {{ prestamoActivo.titulo }}.
      <RouterLink :to="{ name: 'prestamos' }">Devolver desde Mis pr?stamos</RouterLink>
    </p>
    <div v-else class="acciones">
      <label class="campo-sucursal">
        <span>Sucursal</span>
        <select v-model="sucursalSeleccionada">
          <option value="" disabled>Elegir sucursal...</option>
          <option
            v-for="item in disponibilidad"
            :key="item.sucursal.id"
            :value="item.sucursal.id"
            :disabled="item.cantidad === 0"
          >
            {{ item.sucursal.nombre }}
          </option>
        </select>
      </label>

      <button @click="solicitar">Retirar libro</button>
    </div>

    <!-- Mensajes al usuario -->
    <p v-if="mensajeExito" class="mensaje exito" role="status">{{ mensajeExito }}</p>
    <p v-if="mensajeError" class="mensaje error" role="alert">{{ mensajeError }}</p>
  </div>
</template>

<style scoped>
.card {
  min-width: 0;
  overflow-wrap: anywhere;
  background-color: #242936;
  border: 1px solid #3b4252;
  border-radius: 8px;
  padding: 16px;
  color: #eceff4;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.genero {
  font-size: 0.75rem;
  background-color: #3b4252;
  color: #88c0d0;
  padding: 2px 8px;
  border-radius: 4px;
  align-self: flex-start;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #ffffff;
}

.autor {
  margin: 0;
  color: #d8dee9;
  font-size: 0.9rem;
}

.disponibilidad {
  margin-top: auto;
  background-color: #1e222d;
  padding: 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.disponibilidad p {
  margin: 0 0 6px 0;
}

.disponibilidad ul {
  margin: 0;
  padding-left: 20px;
}

.con-stock {
  color: #a3be8c;
  font-weight: bold;
}

.sin-stock {
  color: #bf616a;
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.campo-sucursal {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 130px;
  min-width: 0;
  font-size: 0.85rem;
}

select {
  width: 100%;
  background-color: #2e3440;
}

.acciones button {
  flex: 1 1 auto;
}

.mensaje {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.exito {
  background-color: rgba(163, 190, 140, 0.2);
  color: #a3be8c;
  border: 1px solid #a3be8c;
}

.error {
  background-color: rgba(191, 97, 106, 0.2);
  color: #d08770;
  border: 1px solid #bf616a;
}
</style>
