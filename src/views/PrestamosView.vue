<script setup>
import { computed, ref } from "vue";
import { BibliotecaService } from "../services/bibliotecaService.js";

const prestamos = computed(() => BibliotecaService.obtenerPrestamos().reverse());
const error = ref("");
const mensaje = ref("");

function devolver(prestamo) {
  error.value = "";
  mensaje.value = "";
  try {
    BibliotecaService.devolver(prestamo.id_prestamo);
    mensaje.value = `Devolviste ${prestamo.titulo} en ${prestamo.sucursal}. El stock fue repuesto.`;
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <section aria-labelledby="titulo-prestamos">
    <h2 id="titulo-prestamos">Mis préstamos</h2>
    <p>Podés tener un libro activo. Al devolverlo pasa de leyendo a terminado.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="mensaje" role="status">{{ mensaje }}</p>
    <p v-if="!prestamos.length">Todavía no retiraste libros. <RouterLink :to="{ name: 'listado' }">Explorar el catálogo</RouterLink></p>
    <ul class="prestamos">
      <li v-for="prestamo in prestamos" :key="prestamo.id_prestamo">
        <h3>{{ prestamo.titulo }}</h3>
        <p>{{ prestamo.autor }} · {{ prestamo.sucursal }}</p>
        <p>Estado: <strong>{{ prestamo.estado_lectura }}</strong></p>
        <p>Retiro: {{ prestamo.fecha_retiro }}</p>
        <p v-if="prestamo.fecha_devolucion">Devolución: {{ prestamo.fecha_devolucion }}</p>
        <button v-else @click="devolver(prestamo)">Devolver y terminar</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.prestamos { list-style: none; padding: 0; display: grid; gap: 16px; }
.prestamos li { background: #242936; border: 1px solid #3b4252; border-radius: 8px; padding: 16px; }
h3 { margin-top: 0; }
</style>
