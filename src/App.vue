<script setup>
import { ref, computed, onMounted } from "vue";
import UsuarioCard from "./components/UsuarioCard.vue";

const usuarios = ref([]);
const isLoading = ref(false);
const error = ref("");
const busqueda = ref("");

async function cargarUsuarios() {
  isLoading.value = true;
  error.value = "";

  try {
    const URL = "https://jsonplaceholder.typicode.com/users";
    const respuesta = await fetch(URL);

    if (!respuesta.ok) {
      throw new Error(
        "Error " + respuesta.status + ": " + respuesta.statusText + ". No se pudo cargar la lista de usuarios."
      );
    }

    const respuestaJson = await respuesta.json();
    usuarios.value = respuestaJson;
  } catch (e) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter((usuario) =>
    usuario.name.toLowerCase().includes(busqueda.value.toLowerCase())
  );
});

onMounted(() => {
  cargarUsuarios();
});
</script>

<template>
  <div>
    <h1>Usuarios</h1>

    <div v-if="isLoading">Cargando...</div>

    <div v-else-if="error">
      <p>{{ error }}</p>
      <button @click="cargarUsuarios">Reintentar</button>
    </div>

    <div v-else>
      <input v-model="busqueda" placeholder="Buscar usuario" />

      <p v-if="usuariosFiltrados.length === 0">No se encontraron usuarios.</p>

      <UsuarioCard
        v-for="usuario in usuariosFiltrados"
        :key="usuario.id"
        :nombre="usuario.name"
        :email="usuario.email"
        :ciudad="usuario.address.city"
      />
    </div>
  </div>
</template>