<script setup>
import { ref, watch } from "vue";
import { BibliotecaService } from "../services/bibliotecaService.js";
import LibroCard from "../components/LibroCard.vue";
import MapaSucursales from "../components/MapaSucursales.vue";

const props = defineProps({ id: { type: String, required: true } });
const libro = ref(null);
const isLoading = ref(true);
const error = ref("");

async function cargarDetalle() {
  isLoading.value = true;
  error.value = "";
  libro.value = null;

  try {
    // También carga el catálogo si se abre directamente la URL del detalle.
    await BibliotecaService.cargarLibros(25);
    libro.value = BibliotecaService.getLibroPorId(props.id);
  } catch (e) {
    error.value = e.message || "No se pudo cargar el libro.";
  } finally {
    isLoading.value = false;
  }
}

// Vue reutiliza esta vista al navegar entre IDs: volvemos a buscar el libro.
watch(() => props.id, cargarDetalle, { immediate: true });
</script>

<template>
  <section aria-labelledby="titulo-detalle">
    <RouterLink :to="{ name: 'listado' }">← Volver al listado</RouterLink>
    <h2 id="titulo-detalle">Detalle del libro</h2>
    <div v-if="isLoading" class="estado" role="status">Cargando libro...</div>
    <div v-else-if="error" class="estado" role="alert">
      <p>{{ error }}</p>
      <button @click="cargarDetalle">Reintentar</button>
    </div>
    <div v-else-if="!libro" class="estado" role="status">
      <p>No se encontró un libro con ese ID.</p>
      <RouterLink :to="{ name: 'listado' }">Explorar los libros disponibles</RouterLink>
    </div>
    <div v-else class="detalle">
      <LibroCard :key="libro.id" :libro="libro" :mostrar-detalle="false" />

      <h3 class="titulo-mapa">¿Dónde está disponible?</h3>
      <MapaSucursales :key="`mapa-${libro.id}`" :libro="libro" />
    </div>
  </section>
</template>

<style scoped>
.detalle {
  max-width: 560px;
  margin: 0 auto;
}

.titulo-mapa {
  margin: 24px 0 10px;
  color: #ffffff;
  font-size: 1.1rem;
}
</style>
