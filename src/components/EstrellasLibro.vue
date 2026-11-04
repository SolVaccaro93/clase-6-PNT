<script setup>
// =========================================================================
// Requerimiento: Calificar libros con estrellas
// Un solo componente que MUESTRA el promedio y deja VOTAR. Se usa en la
// tarjeta del listado y en el detalle del libro.
// =========================================================================
import { ref, computed, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore.js";
import { useVotosStore } from "../stores/votosStore.js";
import { formatearPuntaje, PUNTAJE_MINIMO, PUNTAJE_MAXIMO } from "../services/votosCalculo.js";

const props = defineProps({
  libro: { type: Object, required: true }
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const votosStore = useVotosStore();

// ---- Datos que vienen del store (se recalculan solos cuando alguien vota) ----
const resumen = computed(() => votosStore.resumenDe(props.libro));
const miVoto = computed(() => votosStore.miVoto(props.libro.clave));

// ---- Estado local de la interacción ----
// vistaPrevia: valor que se está "probando" con el mouse o el teclado.
// null significa que nadie está calificando y se muestra el promedio.
const vistaPrevia = ref(null);
const mensajeGracias = ref("");
const mensajeError = ref("");
const recienVotado = ref(false);
const selector = ref(null); // el elemento interactivo (para el foco)
const pista = ref(null);    // el área exacta de las 5 estrellas (para medir el mouse)
let temporizadorGracias = null;
let temporizadorPulso = null;

// Lo que se dibuja: la vista previa si hay, si no el promedio
const valorMostrado = computed(() => vistaPrevia.value ?? resumen.value.promedio);

// Ancho de la capa dorada: 3,8 de 5 estrellas = 76 % del ancho
const anchoRelleno = computed(() => `${(valorMostrado.value / PUNTAJE_MAXIMO) * 100}%`);

const textoResumen = computed(() =>
  vistaPrevia.value !== null
    ? `Calificar con ${formatearPuntaje(vistaPrevia.value)}`
    : `${formatearPuntaje(resumen.value.promedio)} (${resumen.value.cantidad})`
);

const leyenda = computed(() => {
  if (vistaPrevia.value !== null && !authStore.estaAutenticado) return "Iniciá sesión para votar";
  if (miVoto.value !== null) return `Tu voto: ${formatearPuntaje(miVoto.value)}`;
  return "";
});

// Texto para lectores de pantalla (el valor numérico solo no alcanza)
const textoAccesible = computed(() => {
  const cantidad = resumen.value.cantidad;
  const partes = [
    `Promedio ${formatearPuntaje(resumen.value.promedio)} de 5`,
    cantidad === 1 ? "1 voto de usuarios" : `${cantidad} votos de usuarios`
  ];
  if (miVoto.value !== null) partes.push(`tu voto ${formatearPuntaje(miVoto.value)}`);
  if (vistaPrevia.value !== null) partes.push(`calificar con ${formatearPuntaje(vistaPrevia.value)}`);
  return partes.join(", ");
});

// ---- Mouse y toque ----

// Convierte la posición horizontal del mouse en un puntaje de media en media estrella.
// Ejemplo: en la mitad izquierda de la 4ª estrella da 3,5 y en la derecha da 4.
function valorDesdePosicion(evento) {
  const caja = pista.value.getBoundingClientRect();
  const fraccion = (evento.clientX - caja.left) / caja.width;
  const valor = Math.ceil(fraccion * PUNTAJE_MAXIMO * 2) / 2;
  return Math.min(PUNTAJE_MAXIMO, Math.max(PUNTAJE_MINIMO, valor));
}

function alMoverMouse(evento) {
  // En pantallas táctiles no hay "pasar el mouse": el voto se da con el toque
  if (evento.pointerType === "touch") return;
  vistaPrevia.value = valorDesdePosicion(evento);
}

function alSalirMouse() {
  // Si el teclado tiene el foco acá, se conserva su vista previa
  if (document.activeElement !== selector.value) vistaPrevia.value = null;
}

function alHacerClic(evento) {
  confirmarVoto(valorDesdePosicion(evento));
}

// ---- Teclado ----
// Flechas: de a media estrella. Home/End: extremos. 1 a 5: estrellas enteras.
// Enter o espacio: confirmar. Escape: cancelar.
function alTocarTecla(evento) {
  const base = vistaPrevia.value ?? miVoto.value ?? 0;
  let nuevo = null;

  if (evento.key === "ArrowRight" || evento.key === "ArrowUp") nuevo = base + 0.5;
  else if (evento.key === "ArrowLeft" || evento.key === "ArrowDown") nuevo = base - 0.5;
  else if (evento.key === "Home") nuevo = PUNTAJE_MINIMO;
  else if (evento.key === "End") nuevo = PUNTAJE_MAXIMO;
  else if (/^[1-5]$/.test(evento.key)) nuevo = Number(evento.key);
  else if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();
    if (vistaPrevia.value !== null) confirmarVoto(vistaPrevia.value);
    return;
  } else if (evento.key === "Escape") {
    vistaPrevia.value = null;
    return;
  } else {
    return; // otras teclas (Tab, etc.) siguen su camino normal
  }

  evento.preventDefault(); // evita que las flechas y el espacio muevan la página
  vistaPrevia.value = Math.min(PUNTAJE_MAXIMO, Math.max(PUNTAJE_MINIMO, nuevo));
}

function alPerderFoco() {
  vistaPrevia.value = null;
}

// ---- Votar ----
function confirmarVoto(valor) {
  mensajeError.value = "";

  // Sin sesión: al login, y el parámetro redirect nos trae de vuelta al mismo lugar
  // (mismo patrón que LibroCard usa para "Retirar libro").
  if (!authStore.estaAutenticado) {
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  try {
    votosStore.votar(props.libro.clave, valor);
  } catch (error) {
    mensajeError.value = error.message;
    return;
  }

  vistaPrevia.value = null;
  mensajeGracias.value = `¡Gracias! Calificaste con ${formatearPuntaje(valor)}.`;
  recienVotado.value = true;

  clearTimeout(temporizadorGracias);
  clearTimeout(temporizadorPulso);
  temporizadorGracias = setTimeout(() => (mensajeGracias.value = ""), 3500);
  temporizadorPulso = setTimeout(() => (recienVotado.value = false), 700);
}

// Si la tarjeta desaparece (por ejemplo, al filtrar), se cancelan los temporizadores
onBeforeUnmount(() => {
  clearTimeout(temporizadorGracias);
  clearTimeout(temporizadorPulso);
});
</script>

<template>
  <div class="estrellas">
    <div class="fila-principal">
      <!-- role="slider": para teclado y lector de pantalla se comporta como un control deslizante -->
      <div
        ref="selector"
        class="selector"
        role="slider"
        tabindex="0"
        :aria-label="`Calificar ${libro.titulo}`"
        :aria-valuemin="PUNTAJE_MINIMO"
        :aria-valuemax="PUNTAJE_MAXIMO"
        :aria-valuenow="vistaPrevia ?? miVoto ?? Math.round(resumen.promedio * 2) / 2"
        :aria-valuetext="textoAccesible"
        @pointermove="alMoverMouse"
        @pointerleave="alSalirMouse"
        @click="alHacerClic"
        @keydown="alTocarTecla"
        @blur="alPerderFoco"
      >
        <span
          ref="pista"
          class="pista"
          :class="{ previsualizando: vistaPrevia !== null, pulso: recienVotado }"
          aria-hidden="true"
        >
          <!-- Capa de abajo: 5 estrellas grises. Capa de arriba: las mismas, doradas, recortadas al ancho del puntaje -->
          <span class="capa capa-base"><span v-for="n in 5" :key="n" class="celda">★</span></span>
          <span class="relleno" :style="{ width: anchoRelleno }">
            <span class="capa capa-llena"><span v-for="n in 5" :key="n" class="celda">★</span></span>
          </span>
        </span>
      </div>

      <span class="resumen" :class="{ 'resumen-previa': vistaPrevia !== null }">{{ textoResumen }}</span>
    </div>

    <small v-if="leyenda" class="leyenda">{{ leyenda }}</small>

    <p v-if="mensajeGracias" class="mensaje-voto gracias" role="status">{{ mensajeGracias }}</p>
    <p v-if="mensajeError" class="mensaje-voto fallo" role="alert">{{ mensajeError }}</p>
  </div>
</template>

<style scoped>
.estrellas {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fila-principal {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
}

/* Zona interactiva: un poco más alta que las estrellas para que sea fácil de tocar */
.selector {
  padding: 6px 0;
  cursor: pointer;
  border-radius: 6px;
  touch-action: manipulation;
}

.selector:focus-visible {
  outline: 2px solid var(--color-accent, #ff8c1a);
  outline-offset: 2px;
}

/* Cada estrella ocupa exactamente 1em: 5 estrellas = 5em.
   Gracias a eso, el recorte por porcentaje cae justo en la mitad de una estrella. */
.pista {
  position: relative;
  display: inline-block;
  width: 5em;
  font-size: 1.35rem;
  line-height: 1;
  transform-origin: left center;
}

.capa {
  display: flex;
  width: 5em;
  font-family: system-ui, "Segoe UI Symbol", sans-serif;
}

/* Celda de ancho fijo: así no depende del ancho real del carácter ★ en cada fuente */
.celda {
  flex: 0 0 1em;
  width: 1em;
  text-align: center;
}

.capa-base {
  color: var(--color-border-light, #4a4a5a);
}

.relleno {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
}

.capa-llena {
  color: var(--color-gold, #f5b83d);
}

/* Mientras se prueba un puntaje, las estrellas cambian al color de acento */
.previsualizando .capa-llena {
  color: var(--color-accent, #ff8c1a);
}

.resumen {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-gold, #f5b83d);
  font-variant-numeric: tabular-nums;
}

.resumen-previa {
  color: var(--color-accent, #ff8c1a);
}

.leyenda {
  color: var(--color-text-muted, #9a9ab0);
  font-size: 0.75rem;
}

.mensaje-voto {
  margin: 4px 0 0;
  padding: 6px 10px;
  border-radius: var(--radio-chico, 6px);
  font-size: 0.8rem;
}

.gracias {
  background-color: color-mix(in srgb, var(--color-success, #4cc38a) 20%, transparent);
  color: var(--color-success, #4cc38a);
  border: 1px solid var(--color-success, #4cc38a);
}

.fallo {
  background-color: color-mix(in srgb, var(--color-danger, #e5484d) 20%, transparent);
  color: var(--color-danger-soft, #ff9a9d);
  border: 1px solid var(--color-danger, #e5484d);
}

/* Confirmación del voto: las estrellas "laten" una vez */
.pulso {
  animation: latir-voto 0.6s ease-out;
}

@keyframes latir-voto {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.14); }
  100% { transform: scale(1); }
}

/* Quien pidió menos movimiento en su sistema no ve la animación */
@media (prefers-reduced-motion: reduce) {
  .pulso {
    animation: none;
  }
}
</style>