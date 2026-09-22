<script setup>
defineProps({
  nombre: String,
  email: String,
  ciudad: String,
});
</script>

<template>
  <div class="usuario-card">
    <h3>{{ nombre }}</h3>
    <p>{{ email }}</p>
    <p>{{ ciudad }}</p>
  </div>
</template>

<style scoped>
.usuario-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}
</style>