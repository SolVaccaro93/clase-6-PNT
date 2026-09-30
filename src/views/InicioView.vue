<template>
  <section class="estado" aria-labelledby="titulo-inicio">
    <h2 id="titulo-inicio">Bienvenido a la biblioteca</h2>
    <p>Explorá el catálogo, encontrá tu próxima lectura y solicitá un ejemplar en tu sucursal.</p>
    <RouterLink :to="{ name: 'listado' }">Ver catálogo de libros →</RouterLink>
  </section>
</template>
