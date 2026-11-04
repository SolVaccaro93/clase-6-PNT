<script setup>
import { ref } from "vue";

// Grilla de portadas sobre rombos de colores (inspirada en "Responsive CSS Grid - Books").
// Cada portada lleva al detalle del libro, donde están las acciones de préstamo.
defineProps({
  libros: { type: Array, required: true }
});

// Portadas que no cargaron: se reemplazan por una tapa con el título
const portadasFallidas = ref(new Set());

function marcarFallida(id) {
  portadasFallidas.value = new Set(portadasFallidas.value).add(id);
}
</script>

<template>
  <div class="contenedor-grilla">
    <ul class="grilla-rombos">
      <li v-for="libro in libros" :key="libro.id">
        <RouterLink
          :to="{ name: 'detalle', params: { id: libro.id } }"
          class="portada"
          :title="`${libro.titulo} — ${libro.autor}`"
        >
          <!-- La tapa es la que se mueve: el link queda quieto y no pierde el hover -->
          <span class="tapa">
            <img
              v-if="libro.portada && !portadasFallidas.has(libro.id)"
              :src="libro.portada"
              :alt="`${libro.titulo}, de ${libro.autor}`"
              loading="lazy"
              @error="marcarFallida(libro.id)"
            />
            <span v-else class="sin-portada">
              <strong>{{ libro.titulo }}</strong>
              <span>{{ libro.autor }}</span>
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* La cantidad de columnas depende del ancho del listado, no de la pantalla */
.contenedor-grilla {
  container-type: inline-size;
  container-name: grilla-libros;
}

.grilla-rombos {
  --columns: 3;
  /* Paleta de Halloween, tomada de los colores de la app */
  --amarillo: var(--color-accent);   /* naranja calabaza */
  --rosa: var(--color-primary);      /* vino */
  --azul: #5b3a7e;                   /* violeta bruja */
  --verde: var(--color-success);     /* verde oliva */
  --blanco: var(--color-gold);       /* dorado vela */

  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  /* Compensa el margen negativo de la primera fila (medio rombo) */
  padding: calc(100% / var(--columns)) 0 0;
  margin: 0;
  list-style: none;
  /* Los rombos van con z-index negativo: así no se esconden detrás del fondo de la página */
  isolation: isolate;
}

/* Cada libro ocupa dos columnas y se superpone medio rombo con la fila de arriba */
li {
  grid-column-end: span 2;
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-top: -50%;
  /* Cada fila pisa media fila de arriba: que la caja vacía no le robe el hover a la portada de atrás */
  pointer-events: none;
}

li:nth-child(2n) {
  grid-column-start: 2;
}

li::before,
li::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-size: 50% 100%, 100% 100%;
  background-position: left, right;
  background-repeat: no-repeat;
}

/* Rombo de fondo con una franja */
li::before {
  z-index: -1;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  background-image:
    linear-gradient(-45deg, var(--amarillo) 53.5%, var(--verde) 53.5%, var(--verde) 60%, var(--amarillo) 60%),
    linear-gradient(45deg, var(--amarillo) 65.3%, var(--verde) 65.3%, var(--verde) 69.9%, var(--amarillo) 69.9%);
}

/* "Bolsillo" en V que tapa la parte de abajo de la portada */
li::after {
  clip-path: polygon(100% 50%, 50% 100%, 0 50%, 20% 50%, 50% 80%, 80% 50%);
  background-image:
    linear-gradient(45deg, var(--amarillo) 40%, var(--verde) 40%),
    linear-gradient(-45deg, var(--amarillo) 30%, var(--verde) 30%);
}

li:nth-child(2n)::before {
  background-image:
    linear-gradient(-45deg, var(--rosa) 53.5%, var(--azul) 53.5%, var(--azul) 60%, var(--rosa) 60%),
    linear-gradient(45deg, var(--rosa) 65.3%, var(--azul) 65.3%, var(--azul) 69.9%, var(--rosa) 69.9%);
}

li:nth-child(2n)::after {
  background-image:
    linear-gradient(45deg, var(--rosa) 40%, var(--azul) 40%),
    linear-gradient(-45deg, var(--rosa) 30%, var(--azul) 30%);
}

li:nth-child(5n)::before {
  background-image:
    linear-gradient(-45deg, var(--verde) 53.5%, var(--rosa) 53.5%, var(--rosa) 60%, var(--verde) 60%),
    linear-gradient(45deg, var(--verde) 65.3%, var(--rosa) 65.3%, var(--rosa) 69.9%, var(--verde) 69.9%);
}

li:nth-child(5n)::after {
  background-image:
    linear-gradient(45deg, var(--verde) 40%, var(--rosa) 40%),
    linear-gradient(-45deg, var(--verde) 30%, var(--rosa) 30%);
}

li:nth-child(7n)::before,
li:nth-child(7n-4)::before {
  background-image:
    linear-gradient(-45deg, var(--azul) 53.5%, var(--blanco) 53.5%, var(--blanco) 60%, var(--azul) 60%),
    linear-gradient(45deg, var(--azul) 65.3%, var(--blanco) 65.3%, var(--blanco) 69.9%, var(--azul) 69.9%);
}

li:nth-child(7n)::after,
li:nth-child(7n-4)::after {
  background-image:
    linear-gradient(45deg, var(--azul) 40%, var(--blanco) 40%),
    linear-gradient(-45deg, var(--azul) 30%, var(--blanco) 30%);
}

li:nth-child(9n)::before,
li:nth-child(9n-5)::before {
  background-image:
    linear-gradient(-45deg, var(--blanco) 53.5%, var(--verde) 53.5%, var(--verde) 60%, var(--blanco) 60%),
    linear-gradient(45deg, var(--blanco) 65.3%, var(--verde) 65.3%, var(--verde) 69.9%, var(--blanco) 69.9%);
}

li:nth-child(9n)::after,
li:nth-child(9n-5)::after {
  background-image:
    linear-gradient(45deg, var(--blanco) 40%, var(--verde) 40%),
    linear-gradient(-45deg, var(--blanco) 30%, var(--verde) 30%);
}

/* Portada: centrada en el rombo, levantada para que asome del "bolsillo" */
.portada {
  position: absolute;
  width: 43%;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-60%);
  pointer-events: auto;
}

.tapa {
  display: block;
  box-shadow: 5px -5px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
}

.portada:hover .tapa,
.portada:focus-visible .tapa {
  transform: translateX(10%) translateY(-10%) rotate(25deg);
}

.portada:focus-visible {
  outline: none;
}

.portada:focus-visible .tapa {
  outline: 3px solid var(--color-accent-light);
  outline-offset: 3px;
}

.portada img {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
}

.sin-portada {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  aspect-ratio: 2 / 3;
  padding: 8px;
  overflow: hidden;
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.7rem;
  text-align: center;
}

.sin-portada strong {
  color: var(--color-text);
  font-size: 0.8rem;
}

@media (prefers-reduced-motion: reduce) {
  .tapa {
    transition: none;
  }
}

/* Al sumar columnas, cambia qué libro arranca corrido en la segunda columna */
@container grilla-libros (min-width: 600px) {
  .grilla-rombos { --columns: 5; }
  li:nth-child(2n) { grid-column-start: auto; }
  li:nth-child(4n-1) { grid-column-start: 2; }
}

@container grilla-libros (min-width: 900px) {
  .grilla-rombos { --columns: 7; }
  li:nth-child(4n-1) { grid-column-start: auto; }
  li:nth-child(6n-2) { grid-column-start: 2; }
}

@container grilla-libros (min-width: 1200px) {
  .grilla-rombos { --columns: 9; }
  li:nth-child(6n-2) { grid-column-start: auto; }
  li:nth-child(8n-3) { grid-column-start: 2; }
}

@container grilla-libros (min-width: 1500px) {
  .grilla-rombos { --columns: 11; }
  li:nth-child(8n-3) { grid-column-start: auto; }
  li:nth-child(10n-4) { grid-column-start: 2; }
}
</style>
