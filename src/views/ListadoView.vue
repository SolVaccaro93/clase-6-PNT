<script setup>
import { ref, computed, onMounted } from "vue";
import { BibliotecaService } from "../services/bibliotecaService.js";
import LibroCard from "../components/LibroCard.vue";

const busqueda = ref("");
const generoSeleccionado = ref("Todos");
const generos = ref(["Todos"]);
const libros = ref([]);
const isLoading = ref(true);
const error = ref("");

// Carga inicial de los 25 libros desde la API
async function cargarLibros() {
  isLoading.value = true;
  error.value = "";

  try {
    libros.value = await BibliotecaService.cargarLibros(25);
    generos.value = ["Todos", ...BibliotecaService.getGeneros()];
  } catch (e) {
    error.value = e.message || "Error al conectar con la API de OpenLibrary.";
  } finally {
    isLoading.value = false;
  }
}

// Filtrado de libros con el service acordado
const librosFiltrados = computed(() => {
  return libros.value.length ? BibliotecaService.buscar(busqueda.value, generoSeleccionado.value) : [];
});

onMounted(() => {
  cargarLibros();
});
</script>

<template>
  <section aria-labelledby="titulo-listado">
    <h2 id="titulo-listado">Listado de libros</h2>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="estado" role="status">
      <p>Cargando libros desde OpenLibrary...</p>
    </div>

    <!-- Estado de error con reintento -->
    <div v-else-if="error" class="estado error" role="alert">
      <p>{{ error }}</p>
      <button @click="cargarLibros">Reintentar</button>
    </div>

    <!-- Contenido principal -->
    <div v-else>
      <!-- Filtros de búsqueda (tarea de Patricio) -->
      <div class="filtros">
        <label class="campo campo-busqueda">
          <span>Buscar libro</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por título o autor..."
          />
        </label>

        <label class="campo campo-genero">
          <span>Género</span>
          <select v-model="generoSeleccionado">
            <option v-for="genero in generos" :key="genero" :value="genero">
              {{ genero }}
            </option>
          </select>
        </label>
      </div>

      <!-- Grilla de libros -->
      <p v-if="librosFiltrados.length === 0" class="estado" role="status">No se encontraron libros.</p>

      <div v-else class="grilla">
        <LibroCard
          v-for="libro in librosFiltrados"
          :key="libro.id"
          :libro="libro"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.filtros {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  font-size: 0.9rem;
  color: #d8dee9;
}

.campo-busqueda {
  flex: 1;
}

.campo-genero {
  flex: 0 1 220px;
}

.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 16px;
}

p {
  color: #d8dee9;
}

@media (max-width: 600px) {
  .filtros {
    flex-direction: column;
  }

  .campo-genero {
    flex: auto;
  }
}
</style>
