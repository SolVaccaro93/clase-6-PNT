<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { BibliotecaService } from "../services/bibliotecaService.js";
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

  const sucursalElegida = disponibilidad.value.find(
    (d) => d.sucursal.id === Number(sucursalSeleccionada.value)
  );

  try {
    BibliotecaService.solicitar(props.libro.id, Number(sucursalSeleccionada.value));
    cargarDisponibilidad();
    mensajeExito.value = `¡Listo! Tenés reservado tu ejemplar en ${sucursalElegida.sucursal.nombre}.`;
  } catch (error) {
    const otraConStock = disponibilidad.value.find(
      (d) => d.sucursal.id !== Number(sucursalSeleccionada.value) && d.cantidad > 0
    );

    if (otraConStock) {
      mensajeError.value = `No lo tenemos en ${sucursalElegida.sucursal.nombre}, pero hay ${otraConStock.cantidad} en ${otraConStock.sucursal.nombre}.`;
    } else {
      mensajeError.value = `No hay stock disponible en ninguna sucursal por el momento.`;
    }
  }
}

onMounted(() => {
  cargarDisponibilidad();
});
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
    <div class="acciones">
      <label class="campo-sucursal">
        <span>Sucursal</span>
        <select v-model="sucursalSeleccionada">
          <option value="" disabled>Elegir sucursal...</option>
          <option
            v-for="item in disponibilidad"
            :key="item.sucursal.id"
            :value="item.sucursal.id"
          >
            {{ item.sucursal.nombre }}
          </option>
        </select>
      </label>

      <button @click="solicitar">Solicitar</button>
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
