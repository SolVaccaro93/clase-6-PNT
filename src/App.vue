<template>
  <div class="contenedor">
    <header class="encabezado">
      <h1>📚 Catálogo de Biblioteca</h1>
      <p>Buscá libros y consultá su disponibilidad por sucursal.</p>
      <nav aria-label="Navegación principal">
        <RouterLink :to="{ name: 'inicio' }">Inicio</RouterLink>
        <RouterLink :to="{ name: 'listado' }">Listado</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.contenedor {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}
.encabezado {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #3b4252;
}
h1 {
  color: #ffffff;
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.2;
}
.encabezado p {
  margin: 0;
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
nav a {
  padding: 8px 16px;
  border: 1px solid #4c566a;
  border-radius: 6px;
  text-decoration: none;
}
nav a.router-link-exact-active {
  background-color: #3b4252;
  color: #ffffff;
  border-color: #88c0d0;
}
</style>