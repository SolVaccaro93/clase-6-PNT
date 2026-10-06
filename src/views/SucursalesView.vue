<script setup>
import { ref, onMounted } from "vue";
import { BibliotecaService } from "../services/bibliotecaService.js";
import { getSucursalesConUbicacion } from "../services/ubicacionesSucursales.js";
import MapaSucursales from "../components/MapaSucursales.vue";

const isLoading = ref(true);
const error = ref("");
const sucursales = getSucursalesConUbicacion();

// El mapa necesita el catálogo cargado para calcular el stock de cada sucursal.
async function cargar() {
  isLoading.value = true;
  error.value = "";
  try {
    await BibliotecaService.cargarLibros(25);
  } catch (e) {
    error.value = e.message || "No se pudo cargar el catálogo.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(cargar);
</script>

<template>
  <section aria-labelledby="titulo-sucursales">
    <h2 id="titulo-sucursales">Sucursales</h2>
    <p class="intro">Tocá un marcador para ver los libros disponibles en cada sede.</p>

    <div v-if="isLoading" class="estado" role="status">Cargando sucursales...</div>
    <div v-else-if="error" class="estado" role="alert">
      <p>{{ error }}</p>
      <button @click="cargar">Reintentar</button>
    </div>
    <template v-else>
      <MapaSucursales />

      <!-- Alternativa en texto al mapa -->
      <ul class="lista-sucursales">
        <li v-for="sucursal in sucursales" :key="sucursal.id">
          <strong>{{ sucursal.nombre }}</strong>
          <span>{{ sucursal.direccion }}</span>
          <span class="cantidad">
            {{ BibliotecaService.getLibrosDisponiblesEnSucursal(sucursal.id).length }} títulos disponibles
          </span>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.intro {
  color: #d8dee9;
  margin-top: 0;
}

.lista-sucursales {
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px;
}

.lista-sucursales li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: #242936;
  border: 1px solid #3b4252;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 0.9rem;
  color: #d8dee9;
}

.lista-sucursales strong {
  color: #ffffff;
}

.cantidad {
  color: #88c0d0;
}
</style>
