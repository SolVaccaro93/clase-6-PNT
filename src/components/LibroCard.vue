<script setup>
import { ref, onMounted } from "vue";
import { BibliotecaService } from "../services/bibliotecaService.js";

// Props: solo recibimos el objeto libro
const props = defineProps({
  libro: Object
});

// Variables reactivas simples
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

// Lógica de solicitud y traducción a mensaje amigable
function solicitar() {
  // Limpiamos mensajes anteriores
  mensajeExito.value = "";
  mensajeError.value = "";

  if (!sucursalSeleccionada.value) {
    mensajeError.value = "Por favor, seleccioná una sucursal.";
    return;
  }

  // Buscamos el nombre de la sucursal elegida para armar el mensaje
  const sucursalElegida = disponibilidad.value.find(
    (d) => d.sucursal.id === Number(sucursalSeleccionada.value)
  );

  try {
    // Llamamos al service de Marisol
    BibliotecaService.solicitar(props.libro.id, Number(sucursalSeleccionada.value));

    // Si no tiró error, fue exitoso: refrescamos el stock y avisamos
    cargarDisponibilidad();
    mensajeExito.value = `¡Listo! Tenés reservado tu ejemplar en ${sucursalElegida.sucursal.nombre}.`;
  } catch (error) {
    // Si tiró error, traducimos a un mensaje amigable:
    // Revisamos si en alguna OTRA sucursal sí hay stock
    const otraConStock = disponibilidad.value.find(
      (d) => d.sucursal.id !== Number(sucursalSeleccionada.value) && d.cantidad > 0
    );

    if (otraConStock) {
      // Mensaje del alcance: "No lo tenemos en Floresta, pero hay 2 en Centro"
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

    <!-- Interacción de Solicitar -->
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
