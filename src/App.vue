<script setup>
import { ref, computed, onMounted } from "vue";
import { BibliotecaService } from "./services/bibliotecaService.js";
import LibroCard from "./components/LibroCard.vue";

const busqueda = ref("");
const generoSeleccionado = ref("Todos");
const generos = ref(["Todos"]);
const isLoading = ref(true);
const error = ref("");

// Carga inicial de los 25 libros desde la API
async function cargarLibros() {
  isLoading.value = true;
  error.value = "";

  try {
    await BibliotecaService.cargarLibros(25);
    generos.value = ["Todos", ...BibliotecaService.getGeneros()];
  } catch (e) {
    error.value = e.message || "Error al conectar con la API de OpenLibrary.";
  } finally {
    isLoading.value = false;
  }
}

// Filtrado de libros con el service acordado
const librosFiltrados = computed(() => {
  return BibliotecaService.buscar(busqueda.value, generoSeleccionado.value);
});

onMounted(() => {
  cargarLibros();
});
</script>

<template>
  <div class="contenedor">
    <h1>📚 Catálogo de Biblioteca</h1>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="estado">
      <p>Cargando libros desde OpenLibrary...</p>
    </div>

    <!-- Estado de error con reintento -->
    <div v-else-if="error" class="estado error">
      <p>{{ error }}</p>
      <button @click="cargarLibros">Reintentar</button>
    </div>

    <!-- Contenido principal -->
    <div v-else>
      <!-- Filtros de búsqueda (tarea de Patricio) -->
      <div class="filtros">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por título o autor..."
        />

        <select v-model="generoSeleccionado">
          <option v-for="genero in generos" :key="genero" :value="genero">
            {{ genero }}
          </option>
        </select>
      </div>

      <!-- Grilla de libros (tarea de Matías) -->
      <p v-if="librosFiltrados.length === 0">No se encontraron libros.</p>

      <div v-else class="grilla">
        <LibroCard
          v-for="libro in librosFiltrados"
          :key="libro.id"
          :libro="libro"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.contenedor {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}

h1 {
  color: #ffffff;
  margin-bottom: 20px;
}

.estado {
  background-color: #242936;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #3b4252;
  text-align: center;
}

.estado button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #5e81ac;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.filtros {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

input, select {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #4c566a;
  background-color: #242936;
  color: #ffffff;
  font-size: 0.95rem;
}

input {
  flex: 1;
}

.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

p {
  color: #d8dee9;
}
</style>