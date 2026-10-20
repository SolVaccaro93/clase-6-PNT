<script setup>
// =========================================================================
// Requerimiento: Feed tipo Instagram (cuándo leyeron los libros) - Sol
// =========================================================================
// Muestra una columna de publicaciones: quién, qué libro, si lo empezó o lo
// terminó, y cuándo. Recibe las publicaciones ya ordenadas.
import { ref } from "vue";
import { differenceInCalendarDays, parseISO } from "date-fns";

defineProps({
  publicaciones: { type: Array, required: true }
});

// Portadas que no cargaron: se reemplazan por la tapa de texto.
const portadasFallidas = ref(new Set());

const TEXTO_TIPO = {
  empezo: { accion: "empezó a leer", etiqueta: "📖 Empezó a leer" },
  termino: { accion: "terminó de leer", etiqueta: "✅ Terminó de leer" }
};

// "hoy", "ayer", "hace 3 días" o la fecha si pasó más de una semana
function fechaRelativa(fechaIso) {
  const fecha = parseISO(fechaIso);
  const dias = differenceInCalendarDays(new Date(), fecha);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

function fechaCompleta(fechaIso) {
  return parseISO(fechaIso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function textoDuracion(dias) {
  if (dias <= 0) return "Lo leyó en el día";
  return dias === 1 ? "Lo leyó en 1 día" : `Lo leyó en ${dias} días`;
}

function inicial(nombre) {
  return nombre.charAt(0).toUpperCase();
}
</script>

<template>
  <ol class="feed">
    <li v-for="pub in publicaciones" :key="pub.id">
      <article class="publicacion">
        <header class="cabecera">
          <span class="avatar" :class="{ propio: pub.esPropia }" aria-hidden="true">{{ inicial(pub.nombre) }}</span>
          <div class="autor-pub">
            <strong>{{ pub.nombre }}<span v-if="pub.esPropia" class="vos"> (vos)</span></strong>
            <time :datetime="pub.fecha" :title="fechaCompleta(pub.fecha)">{{ fechaRelativa(pub.fecha) }}</time>
          </div>
        </header>

        <div class="imagen">
          <img
            v-if="pub.portada && !portadasFallidas.has(pub.id)"
            :src="pub.portada"
            :alt="`Portada del libro ${pub.titulo}`"
            loading="lazy"
            @error="portadasFallidas.add(pub.id)"
          />
          <div v-else class="tapa-texto" aria-hidden="true">
            <span class="tapa-titulo">{{ pub.titulo }}</span>
            <span class="tapa-autor">{{ pub.autor }}</span>
          </div>
          <span class="etiqueta" :class="pub.tipo">{{ TEXTO_TIPO[pub.tipo].etiqueta }}</span>
        </div>

        <div class="pie">
          <p class="texto">
            <strong>{{ pub.nombre }}</strong> {{ TEXTO_TIPO[pub.tipo].accion }}
            <em>{{ pub.titulo }}</em>, de {{ pub.autor }}.
          </p>
          <p class="detalle">
            <template v-if="pub.tipo === 'termino'">{{ textoDuracion(pub.diasDeLectura) }} · </template>
            Sucursal {{ pub.sucursal }}
          </p>
          <RouterLink v-if="pub.id_libro" :to="{ name: 'detalle', params: { id: pub.id_libro } }">
            Ver libro<span class="sr-only"> {{ pub.titulo }}</span> →
          </RouterLink>
        </div>
      </article>
    </li>
  </ol>
</template>

<style scoped>
.feed {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.publicacion {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  box-shadow: var(--sombra-chica);
  overflow: hidden;
  overflow-wrap: anywhere;
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-accent);
}

.avatar.propio {
  background-color: var(--color-rose);
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-rose);
}

.autor-pub {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}

.autor-pub strong {
  color: #ffffff;
  font-size: 0.95rem;
}

.vos {
  font-weight: normal;
  color: var(--color-text-muted);
}

.autor-pub time {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.imagen {
  position: relative;
  height: 340px;
  background-color: var(--color-bg-nested);
  display: flex;
  align-items: center;
  justify-content: center;
}

.imagen img {
  max-width: 100%;
  height: 100%;
  object-fit: contain;
}

.tapa-texto {
  width: 200px;
  max-width: 70%;
  height: 280px;
  padding: 20px 16px;
  /* Redondeo asimétrico: imita el lomo del libro (recto a la izquierda) */
  border-radius: var(--radio-chico) var(--radio) var(--radio) var(--radio-chico);
  border-left: 8px solid var(--color-border-light);
  background: linear-gradient(160deg, var(--color-primary), var(--color-border));
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.tapa-titulo {
  color: #ffffff;
  font-weight: bold;
  font-size: 1.15rem;
  line-height: 1.25;
}

.tapa-autor {
  color: var(--color-text-light);
  font-size: 0.85rem;
}

.etiqueta {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 4px 10px;
  border-radius: var(--radio-pill);
  font-size: 0.8rem;
  font-weight: 600;
  background-color: color-mix(in srgb, var(--color-bg) 90%, transparent);
  border: 1px solid;
}

.etiqueta.empezo {
  color: var(--color-gold);
}

.etiqueta.termino {
  color: var(--color-success);
}

.pie {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}

.pie p {
  margin: 0;
}

.texto {
  color: var(--color-text);
}

.texto strong {
  color: #ffffff;
}

.detalle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
