<script setup>
// =========================================================================
// Requerimiento: Vista 'Mis amigos' con lecturas - Sol
// =========================================================================
import { ref, computed, onMounted } from "vue";
import { AuthService } from "../services/authService.js";
import { AmigosService } from "../services/amigosService.js";

const amigos = ref([]);
const solicitudes = ref([]);
const filtro = ref("todos");
const isLoading = ref(true);
const error = ref("");

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "leyendo", texto: "Está leyendo" },
  { valor: "terminado", texto: "Terminó de leer" }
];

// La vista necesita un usuario logueado para saber de quién son los amigos.
const usuario = computed(() => AuthService.usuario);

async function cargarAmigos() {
  if (!usuario.value) {
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = "";
  try {
    const idUsuario = usuario.value.usuario;
    [amigos.value, solicitudes.value] = await Promise.all([
      AmigosService.getAmigosConLecturas(idUsuario),
      AmigosService.getSolicitudesPendientes(idUsuario)
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

onMounted(cargarAmigos);
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
      <p v-if="solicitudes.length" class="aviso-solicitudes">
        Tenés {{ solicitudes.length }} solicitud{{ solicitudes.length > 1 ? "es" : "" }} de amistad pendiente{{ solicitudes.length > 1 ? "s" : "" }}:
        {{ solicitudes.map((s) => s.nombre).join(", ") }}
      </p>

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
  </section>
</template>

<style scoped>
.aviso-solicitudes {
  margin: 0 0 16px;
  padding: 8px 12px;
  background-color: rgba(136, 192, 208, 0.15);
  border: 1px solid #88c0d0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #88c0d0;
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
  background-color: #2e3440;
  border: 1px solid #4c566a;
  color: #d8dee9;
  font-weight: 500;
}

.btn-filtro.activo {
  background-color: #3b4252;
  border-color: #88c0d0;
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
  background-color: #242936;
  border: 1px solid #3b4252;
  border-radius: 8px;
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
  background-color: #5e81ac;
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
  background-color: #1e222d;
  border-radius: 6px;
  padding: 10px;
}

.etiqueta {
  margin: 0 0 6px;
  font-size: 0.85rem;
}

.etiqueta.leyendo {
  color: #ebcb8b;
}

.etiqueta.terminado {
  color: #a3be8c;
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
  color: #d8dee9;
}

.vacio {
  margin: 0;
  font-size: 0.85rem;
  color: #d8dee9;
}
</style>
