<script setup>
// =========================================================================
// Requerimiento: Vista 'Mis amigos' con lecturas - Sol
// =========================================================================
import { ref, computed, watch } from "vue";
import { cambiosPrestamos } from "../services/bibliotecaService.js";
import { useAuthStore } from "../stores/authStore.js";
import { AmigosService } from "../services/amigosService.js";
import FeedLecturas from "../components/FeedLecturas.vue";

const amigos = ref([]);
const feed = ref([]);
const vista = ref("actividad");
const filtro = ref("todos");
const isLoading = ref(true);
const error = ref("");

const PESTANAS = [
  { valor: "actividad", texto: "Actividad" },
  { valor: "amigos", texto: "Amigos" }
];

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "leyendo", texto: "Está leyendo" },
  { valor: "terminado", texto: "Terminó de leer" }
];

// La vista necesita un usuario logueado para saber de quién son los amigos.
const authStore = useAuthStore();
const usuario = computed(() => authStore.usuario);

async function cargarAmigos() {
  if (!usuario.value) {
    amigos.value = [];
    feed.value = [];
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = "";
  try {
    const idUsuario = usuario.value.usuario;
    [amigos.value, feed.value] = await Promise.all([
      AmigosService.getAmigosConLecturas(idUsuario),
      AmigosService.getFeedActividad(idUsuario)
    ]);
  } catch (e) {
    error.value = e.message || "No se pudieron cargar tus amigos.";
  } finally {
    isLoading.value = false;
  }
}

// Con un filtro activo se ocultan los amigos que no tienen lecturas en ese estado.
const amigosFiltrados = computed(() => {
  if (filtro.value === "leyendo") return amigos.value.filter((a) => a.leyendo.length > 0);
  if (filtro.value === "terminado") return amigos.value.filter((a) => a.terminados.length > 0);
  return amigos.value;
});

function formatearFecha(fechaIso) {
  return new Date(`${fechaIso}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short"
  });
}

function inicial(nombre) {
  return nombre.charAt(0).toUpperCase();
}

watch([() => usuario.value?.usuario, cambiosPrestamos], cargarAmigos, { immediate: true });
</script>

<template>
  <section aria-labelledby="titulo-amigos">
    <h2 id="titulo-amigos">Mis amigos</h2>

    <div v-if="!usuario" class="estado" role="status">
      <p>Iniciá sesión para ver qué están leyendo tus amigos.</p>
      <RouterLink :to="{ name: 'login', query: { redirect: '/amigos' } }">Iniciar sesión</RouterLink>
    </div>
    <div v-else-if="isLoading" class="estado" role="status">Cargando amigos...</div>
    <div v-else-if="error" class="estado" role="alert">
      <p>{{ error }}</p>
      <button @click="cargarAmigos">Reintentar</button>
    </div>

    <template v-else>
      <!-- Fila de "historias": el aro de color indica que el amigo está leyendo algo -->
      <ul v-if="amigos.length" class="historias" aria-label="Tus amigos">
        <li
          v-for="amigo in amigos"
          :key="amigo.id_usuario"
          class="historia"
          :title="amigo.leyendo.length ? `Está leyendo ${amigo.leyendo[0].titulo}` : 'No está leyendo nada ahora'"
        >
          <span class="aro" :class="{ leyendo: amigo.leyendo.length }">
            <span class="avatar-historia" aria-hidden="true">{{ inicial(amigo.nombre) }}</span>
          </span>
          <span class="nombre-historia">{{ amigo.nombre.split(" ")[0] }}</span>
          <span class="sr-only">{{ amigo.leyendo.length ? "está leyendo" : "no está leyendo" }}</span>
        </li>
      </ul>

      <!-- Requerimiento: Feed tipo Instagram - Sol -->
      <div class="pestanas" role="group" aria-label="Qué querés ver">
        <button
          v-for="p in PESTANAS"
          :key="p.valor"
          type="button"
          class="btn-pestana"
          :class="{ activo: vista === p.valor }"
          :aria-pressed="vista === p.valor"
          @click="vista = p.valor"
        >
          {{ p.texto }}
        </button>
      </div>

      <template v-if="vista === 'actividad'">
        <p v-if="feed.length === 0" class="estado" role="status">
          Todavía no hay actividad. Cuando vos o tus amigos retiren o terminen un libro, va a aparecer acá.
        </p>
        <FeedLecturas v-else :publicaciones="feed" />
      </template>

      <template v-else>
      <div class="filtros" role="group" aria-label="Filtrar por estado de lectura">
        <button
          v-for="f in FILTROS"
          :key="f.valor"
          type="button"
          class="btn-filtro"
          :class="{ activo: filtro === f.valor }"
          :aria-pressed="filtro === f.valor"
          @click="filtro = f.valor"
        >
          {{ f.texto }}
        </button>
      </div>

      <p v-if="amigos.length === 0" class="estado" role="status">Todavía no tenés amigos agregados.</p>
      <p v-else-if="amigosFiltrados.length === 0" class="estado" role="status">
        Ningún amigo coincide con este filtro.
      </p>

      <ul v-else class="lista-amigos">
        <li v-for="amigo in amigosFiltrados" :key="amigo.id_usuario" class="card-amigo">
          <div class="cabecera-amigo">
            <span class="avatar" aria-hidden="true">{{ inicial(amigo.nombre) }}</span>
            <h3>{{ amigo.nombre }}</h3>
          </div>

          <div v-if="filtro !== 'terminado'" class="bloque">
            <h4 class="etiqueta leyendo">📖 Está leyendo</h4>
            <ul v-if="amigo.leyendo.length" class="lecturas">
              <li v-for="l in amigo.leyendo" :key="l.id_prestamo">
                <strong>{{ l.titulo }}</strong> · {{ l.autor }}
                <span class="meta">Retirado el {{ formatearFecha(l.fecha_retiro) }} en {{ l.sucursal }}</span>
              </li>
            </ul>
            <p v-else class="vacio">No está leyendo nada ahora.</p>
          </div>

          <div v-if="filtro !== 'leyendo'" class="bloque">
            <h4 class="etiqueta terminado">✅ Terminó de leer</h4>
            <ul v-if="amigo.terminados.length" class="lecturas">
              <li v-for="l in amigo.terminados" :key="l.id_prestamo">
                <strong>{{ l.titulo }}</strong> · {{ l.autor }}
                <span class="meta">Terminado el {{ formatearFecha(l.fecha_devolucion) }}</span>
              </li>
            </ul>
            <p v-else class="vacio">Todavía no terminó ningún libro.</p>
          </div>
        </li>
      </ul>
      </template>
    </template>
  </section>
</template>

<style scoped>
.historias {
  list-style: none;
  margin: 0 0 16px;
  padding: 4px 2px 8px;
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.historia {
  flex-shrink: 0;
  width: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.aro {
  padding: 3px;
  border-radius: 50%;
  background: var(--color-border-light);
}

.aro.leyendo {
  background: linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7);
}

.avatar-historia {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid var(--color-bg);
  background-color: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
}

.nombre-historia {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.pestanas {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.btn-pestana {
  flex: 1;
  background: none;
  border-radius: 0;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-weight: 600;
}

.btn-pestana:hover {
  background-color: var(--color-surface);
}

.btn-pestana.activo {
  color: #ffffff;
  border-bottom-color: var(--color-accent);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.btn-filtro {
  min-height: 36px;
  padding: 4px 14px;
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-muted);
  font-weight: 500;
}

.btn-filtro.activo {
  background-color: var(--color-border);
  border-color: var(--color-accent);
  color: #ffffff;
}

.lista-amigos {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 16px;
}

.card-amigo {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  box-shadow: var(--sombra-chica);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-wrap: anywhere;
}

.cabecera-amigo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.cabecera-amigo h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #ffffff;
}

.bloque {
  background-color: var(--color-bg-nested);
  border-radius: var(--radio-chico);
  padding: 10px;
}

.etiqueta {
  margin: 0 0 6px;
  font-size: 0.85rem;
}

.etiqueta.leyendo {
  color: var(--color-gold);
}

.etiqueta.terminado {
  color: var(--color-success);
}

.lecturas {
  margin: 0;
  padding-left: 18px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.vacio {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
</style>
