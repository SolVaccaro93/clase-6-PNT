<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { BibliotecaService, cambiosStock } from "../services/bibliotecaService.js";
import { useAuthStore } from "../stores/authStore.js";

// obtenemos el store de autenticación (Pinia)
const authStore = useAuthStore();

const props = defineProps({
  libro: Object,
  mostrarDetalle: { type: Boolean, default: true }
});

const router = useRouter();
const route = useRoute();

// Variables reactivas
const disponibilidad = ref([]);
const sucursalesConStock = computed(() => disponibilidad.value.filter(item => item.cantidad > 0));
const sucursalSeleccionada = ref("");
const mensajeExito = ref("");
const mensajeError = ref("");
const imagenFallida = ref(false);

const prestamoDelLibro = computed(() => BibliotecaService.obtenerPrestamoActivoDeLibro(props.libro.clave));

// URL de portada (mediana para catálogo, grande o mediana para vista detalle)
const portadaUrl = computed(() => {
  if (!props.libro) return null;
  return props.mostrarDetalle
    ? (props.libro.portada || null)
    : (props.libro.portadaGrande || props.libro.portada || null);
});

watch(() => props.libro?.id, () => {
  imagenFallida.value = false;
});

// Consulta la disponibilidad al service
function cargarDisponibilidad() {
  try {
    disponibilidad.value = BibliotecaService.consultarDisponibilidad(props.libro.id);
    if (!sucursalesConStock.value.some(item => item.sucursal.id === Number(sucursalSeleccionada.value))) {
      sucursalSeleccionada.value = "";
    }
  } catch (error) {
    mensajeError.value = "Error al consultar disponibilidad.";
  }
}

// =========================================================================
// Requerimiento: Redirección al login con retorno exacto - Matías
// =========================================================================
function solicitar() {
  mensajeExito.value = "";
  mensajeError.value = "";

  // Si el usuario no ha iniciado sesión, lo redirigimos al Login
  // pasándole como parámetro 'redirect' la ruta exacta donde está ahora
if (!authStore.estaAutenticado) {
    router.push({
      name: "login",
      query: { redirect: route.fullPath }
    });
    return;
  }

  if (!sucursalSeleccionada.value) {
    mensajeError.value = "Por favor, seleccioná una sucursal.";
    return;
  }

  try {
    const prestamo = BibliotecaService.retirar(props.libro.id, Number(sucursalSeleccionada.value));
    mensajeExito.value = `Retiraste tu ejemplar en ${prestamo.sucursal}. Estado: leyendo.`;
  } catch (error) {
    mensajeError.value = error.message;
  }
}

function devolver() {
  mensajeExito.value = "";
  mensajeError.value = "";
  try {
    BibliotecaService.devolver(prestamoDelLibro.value.id_prestamo);
    mensajeExito.value = "Libro devuelto. Estado: terminado. El ejemplar vuelve a estar disponible.";
  } catch (error) {
    mensajeError.value = error.message;
  }
}

watch([cambiosStock, () => props.libro.id], cargarDisponibilidad, { immediate: true });
</script>

<template>
  <div class="card" :class="{ 'card-detalle': !mostrarDetalle }">
    <!-- Portada del libro (Preview en catálogo / Portada destacada en detalle) -->
    <div class="portada-contenedor" :class="{ 'portada-detalle': !mostrarDetalle }">
      <img
        v-if="portadaUrl && !imagenFallida"
        :src="portadaUrl"
        :alt="`Portada del libro ${libro.titulo}`"
        class="portada-img"
        loading="lazy"
        @error="imagenFallida = true"
      />
      <div v-else class="portada-fallback" aria-hidden="true">
        <span class="fallback-icono">📖</span>
        <span class="fallback-titulo">{{ libro.titulo }}</span>
        <span class="fallback-autor">{{ libro.autor }}</span>
      </div>
    </div>

    <span class="genero">{{ libro.genero }}</span>
    <h2>{{ libro.titulo }}</h2>
    <p class="autor">Autor: {{ libro.autor }}</p>

    <!-- Metadatos rápidos en el catálogo (páginas, año, puntaje de la crítica) -->
    <div v-if="mostrarDetalle" class="metadatos-preview">
      <span class="meta-chip chip-paginas" :title="`Cantidad de páginas: ${libro.paginas}`">
        📄 {{ libro.paginas }} págs.
      </span>
      <span class="meta-chip chip-anio" :title="`Año de publicación: ${libro.anioPublicacion}`">
        📅 {{ libro.anioPublicacion }}
      </span>
      <span class="meta-chip chip-puntaje" :title="`Puntaje de la crítica: ${libro.puntajeTexto} (${libro.criticasTotal} críticas)`">
        ⭐ {{ libro.puntaje }} <span class="meta-sub">/ 5</span>
      </span>
    </div>

    <!-- Ficha Técnica Completa (exclusiva de la vista de Detalle) -->
    <div v-else class="ficha-tecnica">
      <h3 class="ficha-titulo">📋 Ficha Técnica</h3>
      <div class="ficha-grid">
        <div class="ficha-item">
          <span class="ficha-label">📅 Año de Publicación</span>
          <span class="ficha-valor">{{ libro.anioPublicacion }}</span>
        </div>
        <div class="ficha-item">
          <span class="ficha-label">📄 Cantidad de Páginas</span>
          <span class="ficha-valor">{{ libro.paginas }} páginas</span>
        </div>
        <div class="ficha-item">
          <span class="ficha-label">⭐ Puntaje de la Crítica</span>
          <span class="ficha-valor valor-puntaje">
            {{ libro.puntajeTexto }}
            <small v-if="libro.criticasTotal" class="criticas-count">({{ libro.criticasTotal }} críticas)</small>
          </span>
        </div>
        <div class="ficha-item">
          <span class="ficha-label">🏢 Editorial</span>
          <span class="ficha-valor">{{ libro.editorial }}</span>
        </div>
        <div class="ficha-item">
          <span class="ficha-label">🌐 Idioma</span>
          <span class="ficha-valor">{{ libro.idioma }}</span>
        </div>
        <div class="ficha-item">
          <span class="ficha-label">📚 Ediciones Registradas</span>
          <span class="ficha-valor">{{ libro.ediciones }}</span>
        </div>
      </div>
    </div>

    <RouterLink v-if="mostrarDetalle" :to="{ name: 'detalle', params: { id: libro.id } }">
      Ver detalle<span class="sr-only"> de {{ libro.titulo }}</span> →
    </RouterLink>

    <!-- Disponibilidad por sucursal -->
    <div class="disponibilidad">
      <p><strong>Disponibilidad:</strong></p>
      <ul>
        <li v-for="item in disponibilidad" :key="item.sucursal.id">
          {{ item.sucursal.nombre }}:
          <span :class="item.cantidad > 0 ? 'con-stock' : 'sin-stock'">
            {{ item.cantidad > 0 ? item.cantidad + ' disponibles' : 'Agotado' }}
          </span>
        </li>
      </ul>
    </div>

    <!-- Interacción de Solicitar (con protección de login on-demand) -->
    <div v-if="prestamoDelLibro" class="acciones">
      <p>Estado: <strong>leyendo</strong> • Retirado en {{ prestamoDelLibro.sucursal }}</p>
      <button @click="devolver">Devolver y terminar</button>
    </div>
    <div v-else class="acciones">
      <label class="campo-sucursal">
        <span>Sucursal</span>
        <select v-model="sucursalSeleccionada" :disabled="sucursalesConStock.length === 0">
          <option value="" disabled>{{ sucursalesConStock.length ? 'Elegir sucursal...' : 'Sin sucursales con stock' }}</option>
          <option
            v-for="item in sucursalesConStock"
            :key="item.sucursal.id"
            :value="item.sucursal.id"
          >
            {{ item.sucursal.nombre }}
          </option>
        </select>
      </label>

      <button :disabled="sucursalesConStock.length === 0" @click="solicitar">Retirar libro</button>
    </div>

    <!-- Mensajes al usuario -->
    <p v-if="mensajeExito" class="mensaje exito" role="status">{{ mensajeExito }}</p>
    <p v-if="mensajeError" class="mensaje error" role="alert">{{ mensajeError }}</p>
  </div>
</template>

<style scoped>
.card {
  min-width: 0;
  overflow-wrap: anywhere;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  padding: 16px;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--sombra-chica);
  transition: transform var(--transicion), box-shadow var(--transicion),
              border-color var(--transicion);
}

/* La tarjeta se levanta, proyecta más sombra y se le ilumina el borde */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sombra);
  border-color: var(--color-accent);
}

/* Portada del libro (preview y detalle) */
.portada-contenedor {
  width: 100%;
  height: 200px;
  background: linear-gradient(180deg, var(--color-bg-deep) 0%, var(--color-bg-nested) 100%);
  border-radius: var(--radio-chico);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--color-surface-alt);
  position: relative;
}

.portada-img {
  max-height: 190px;
  max-width: 135px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--radio-chico);
  box-shadow: var(--sombra);
  transition: transform var(--transicion);
}

.card:hover .portada-img {
  transform: scale(1.04);
}

/* Estilo destacado de portada en vista de detalle */
.portada-contenedor.portada-detalle {
  height: 290px;
  max-width: 220px;
  margin: 0 auto 6px auto;
  background: linear-gradient(180deg, var(--color-bg-deep) 0%, var(--color-surface) 100%);
  border: 1px solid var(--color-border);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.35);
}

.portada-contenedor.portada-detalle .portada-img {
  max-height: 270px;
  max-width: 190px;
  box-shadow: var(--sombra-grande);
}

.portada-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px;
  text-align: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-bg-nested) 0%, var(--color-surface-alt) 100%);
}

.fallback-icono {
  font-size: 2.5rem;
  line-height: 1;
}

.fallback-titulo {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-light);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fallback-autor {
  font-size: 0.72rem;
  color: var(--color-accent);
}

.genero {
  font-size: 0.75rem;
  background-color: var(--color-border);
  color: var(--color-accent);
  padding: 2px 8px;
  border-radius: var(--radio-chico);
  align-self: flex-start;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #ffffff;
}

.autor {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.disponibilidad {
  margin-top: auto;
  background-color: var(--color-bg-nested);
  padding: 10px;
  border-radius: var(--radio-chico);
  font-size: 0.85rem;
}

.disponibilidad p {
  margin: 0 0 6px 0;
}

.disponibilidad ul {
  margin: 0;
  padding-left: 20px;
}

.con-stock {
  color: var(--color-success);
  font-weight: bold;
}

.sin-stock {
  color: var(--color-danger);
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.campo-sucursal {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 130px;
  min-width: 0;
  font-size: 0.85rem;
}

select {
  width: 100%;
  background-color: var(--color-surface-alt);
}

.acciones button {
  flex: 1 1 auto;
}

.mensaje {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--radio-chico);
  font-size: 0.85rem;
}

.exito {
  background-color: color-mix(in srgb, var(--color-success) 20%, transparent);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.error {
  background-color: color-mix(in srgb, var(--color-danger) 20%, transparent);
  color: var(--color-danger-soft);
  border: 1px solid var(--color-danger);
}

/* Metadatos rápidos en el catálogo */
.metadatos-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 2px 0 4px 0;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.74rem;
  padding: 3px 8px;
  border-radius: var(--radio-chico);
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border-hover);
  color: var(--color-text);
  font-weight: 500;
}

.chip-puntaje {
  background-color: color-mix(in srgb, var(--color-gold) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-gold) 40%, transparent);
  color: var(--color-gold);
  font-weight: 600;
}

.chip-paginas {
  background-color: color-mix(in srgb, var(--color-rose) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-rose) 38%, transparent);
  color: var(--color-rose);
}

.chip-anio {
  background-color: color-mix(in srgb, var(--color-text-dim) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-text-dim) 35%, transparent);
  color: var(--color-text-muted);
}

.meta-sub {
  font-size: 0.65rem;
  opacity: 0.8;
  margin-left: 2px;
}

/* Ficha Técnica completa en Vista Detalle */
.ficha-tecnica {
  background: var(--color-bg-nested);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  padding: 14px;
  margin: 8px 0;
}

.ficha-titulo {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: var(--color-accent);
  font-weight: 700;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--color-surface-alt);
  padding-bottom: 6px;
}

.ficha-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.ficha-item {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-alt);
  border-radius: var(--radio-chico);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ficha-label {
  font-size: 0.68rem;
  color: var(--color-text-dim);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.ficha-valor {
  font-size: 0.88rem;
  color: var(--color-text);
  font-weight: 600;
}

.valor-puntaje {
  color: var(--color-gold);
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.criticas-count {
  font-size: 0.7rem;
  color: var(--color-text-dim);
  font-weight: normal;
}
</style>
