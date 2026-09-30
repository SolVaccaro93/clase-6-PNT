<template>
  <section class="estado">
    <h2>Página no encontrada</h2>
    <p>La dirección que ingresaste no corresponde a una pantalla de la biblioteca.</p>
    <RouterLink :to="{ name: 'inicio' }">Volver al inicio</RouterLink>
  </section>
</template>
