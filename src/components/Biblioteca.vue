<script setup>
import { ref } from "vue";

const biblioteca = ref([]);
const isLoading = ref(false);
const error = ref("");

async function cargarBiblioteca() {
  isLoading.value = true;
  error.value = "";

  try {
    const URL = "https://openlibrary.org/search.json?q=cien+años+de+soledad";
    const respuesta = await fetch(URL);

    if (!respuesta.ok) {
      throw new Error(
        "Error " + respuesta.status + ": " + respuesta.statusText
      );
    }

    const respuestaJson = await respuesta.json();
    biblioteca.value = respuestaJson.docs;
  } catch (e) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <button @click="cargarBiblioteca">Cargar biblioteca</button>

    <div v-if="isLoading">Cargando...</div>
    <div v-else-if="error">{{ error }}</div>
    <ul v-else>
      <li v-for="libro in biblioteca" :key="libro.key">
        {{ libro.title }} — {{ libro.author_name?.[0] }}
      </li>
    </ul>
  </div>
</template>