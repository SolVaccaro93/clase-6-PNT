<script setup>
// =========================================================================
// Requerimiento: Perfil del dueño - métricas de préstamos e interacciones - Sol
// =========================================================================
import { ref, computed, onMounted } from "vue";
import { BibliotecaService, SUCURSALES, cambiosStock, cargarTodosLosPrestamos } from "../services/bibliotecaService.js";
import { hidratarDatos } from "../services/apiClient.js";
import { leerEventosDelServidor } from "../services/eventosService.js";
import { PERIODOS, calcularMetricas, generarDatosDemo } from "../services/metricasService.js";
import { formatearPuntaje } from "../services/votosCalculo.js";
import { useVotosStore } from "../stores/votosStore.js";

const votosStore = useVotosStore();

const libros = ref([]);
const eventos = ref([]);
const isLoading = ref(true);
const errorCatalogo = ref("");
const dias = ref(30);
const modoDemo = ref(false);

async function cargar() {
  isLoading.value = true;
  errorCatalogo.value = "";
  try {
    // Datos frescos de la base: lo que hicieron los demás usuarios desde la última vez
    await hidratarDatos();
    const [, eventosServidor] = await Promise.all([cargarTodosLosPrestamos(), leerEventosDelServidor()]);
    eventos.value = eventosServidor;
    libros.value = await BibliotecaService.cargarLibros();
  } catch (e) {
    // Sin catálogo igual se ven los préstamos y búsquedas; faltan títulos de votos y el stock
    errorCatalogo.value = e.message || "No se pudo cargar el catálogo.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(cargar);

function stockTotalDe(libro) {
  cambiosStock.value;
  return BibliotecaService.consultarDisponibilidad(libro.id).reduce((total, d) => total + d.cantidad, 0);
}

const datosReales = computed(() => ({
  prestamos: BibliotecaService.obtenerTodosLosPrestamos(),
  votos: votosStore.votos,
  eventos: eventos.value
}));

const hayActividadReal = computed(() =>
  datosReales.value.prestamos.length > 0 ||
  Object.keys(datosReales.value.votos).length > 0 ||
  datosReales.value.eventos.length > 0
);

const datosDemo = computed(() => generarDatosDemo({ libros: libros.value, sucursales: SUCURSALES }));

const metricas = computed(() => {
  const datos = modoDemo.value ? datosDemo.value : datosReales.value;
  return calcularMetricas({
    ...datos,
    libros: libros.value,
    stockTotalDe,
    sucursales: SUCURSALES,
    dias: dias.value
  });
});

// ---- Ayudas para los gráficos ----
const maximo = (lista) => Math.max(1, ...lista.map((item) => item.cantidad));
const maxPorDia = computed(() => maximo(metricas.value.porDia));
const maxPorSucursal = computed(() => maximo(metricas.value.porSucursal));
const maxVotos = computed(() => maximo(metricas.value.distribucionVotos));

// En el eje de fechas se muestran algunas etiquetas, no todas, para que no se encimen
const cadaCuantos = computed(() => (dias.value <= 7 ? 1 : dias.value <= 30 ? 5 : 15));
function mostrarEtiqueta(indice) {
  const ultimo = metricas.value.porDia.length - 1;
  return (ultimo - indice) % cadaCuantos.value === 0;
}

function porcentaje(valor, max) {
  return `${(valor / max) * 100}%`;
}

function plural(n, singular, pluralTexto) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}
</script>

<template>
  <section class="metricas" aria-labelledby="titulo-metricas">
    <header class="encabezado">
      <div>
        <h2 id="titulo-metricas">📊 Métricas del negocio</h2>
        <p class="subtitulo">Préstamos, valoraciones y búsquedas de los lectores.</p>
      </div>

      <div class="controles">
        <div class="periodos" role="group" aria-label="Período">
          <button
            v-for="p in PERIODOS"
            :key="p.dias"
            type="button"
            class="btn-periodo"
            :class="{ activo: dias === p.dias }"
            :aria-pressed="dias === p.dias"
            @click="dias = p.dias"
          >
            {{ p.texto }}
          </button>
        </div>
        <button
          type="button"
          class="btn-demo"
          :aria-pressed="modoDemo"
          :disabled="!libros.length"
          @click="modoDemo = !modoDemo"
        >
          {{ modoDemo ? "Ver datos reales" : "Ver con datos de demostración" }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="estado" role="status">Cargando métricas...</div>

    <template v-else>
      <p v-if="modoDemo" class="aviso aviso-demo" role="status">
        Estás viendo <strong>datos de demostración</strong>: son inventados y no se guardan.
      </p>
      <p v-else-if="!hayActividadReal" class="aviso" role="status">
        Todavía no hay actividad en este navegador.
        <template v-if="libros.length">Probá con <strong>Ver con datos de demostración</strong>.</template>
      </p>
      <p v-if="errorCatalogo" class="aviso" role="alert">
        {{ errorCatalogo }} Faltan los títulos de los votos y el stock de los libros.
      </p>

      <!-- Números principales -->
      <ul class="kpis">
        <li class="kpi">
          <span class="kpi-num">{{ metricas.kpis.prestamos }}</span>
          <span class="kpi-desc">Préstamos en el período</span>
        </li>
        <li class="kpi">
          <span class="kpi-num">{{ metricas.kpis.activos }}</span>
          <span class="kpi-desc">Prestados ahora</span>
        </li>
        <li class="kpi" :class="{ alerta: metricas.kpis.atrasados > 0 }">
          <span class="kpi-num">{{ metricas.kpis.atrasados }}</span>
          <span class="kpi-desc">
            <span v-if="metricas.kpis.atrasados > 0" aria-hidden="true">⚠️ </span>Atrasados
          </span>
        </li>
        <li class="kpi">
          <span class="kpi-num">{{ metricas.kpis.lectoresActivos }}</span>
          <span class="kpi-desc">Lectores activos</span>
        </li>
        <li class="kpi">
          <span class="kpi-num">
            {{ metricas.kpis.diasDeLectura === null ? "—" : Math.round(metricas.kpis.diasDeLectura) }}
          </span>
          <span class="kpi-desc">Días promedio de lectura</span>
        </li>
        <li class="kpi">
          <span class="kpi-num">
            {{ metricas.kpis.puntajePromedio === null ? "—" : formatearPuntaje(metricas.kpis.puntajePromedio) }}
          </span>
          <span class="kpi-desc">⭐ Promedio ({{ plural(metricas.kpis.votos, "voto", "votos") }})</span>
        </li>
      </ul>

      <!-- Conclusiones -->
      <section v-if="metricas.conclusiones.length" class="panel">
        <h3>💡 Qué conviene mirar</h3>
        <ul class="conclusiones">
          <li v-for="(texto, i) in metricas.conclusiones" :key="i">{{ texto }}</li>
        </ul>
      </section>

      <!-- Préstamos por día -->
      <section class="panel">
        <h3>Préstamos por día</h3>
        <p v-if="metricas.kpis.prestamos === 0" class="vacio">Sin préstamos en este período.</p>
        <template v-else>
          <div class="grafico-dias">
            <span class="eje-max" aria-hidden="true">{{ maxPorDia }}</span>
            <ol class="barras-dias" aria-label="Préstamos por día">
              <li
                v-for="(dia, i) in metricas.porDia"
                :key="dia.fecha"
                class="columna"
                tabindex="0"
                :aria-label="`${dia.etiqueta}: ${plural(dia.cantidad, 'préstamo', 'préstamos')}`"
              >
                <span class="barra" :style="{ height: porcentaje(dia.cantidad, maxPorDia) }"></span>
                <span class="tooltip" aria-hidden="true">
                  <strong>{{ dia.cantidad }}</strong> {{ dia.etiqueta }}
                </span>
                <span class="etiqueta-x" aria-hidden="true">{{ mostrarEtiqueta(i) ? dia.etiqueta : "" }}</span>
              </li>
            </ol>
          </div>
          <details class="tabla-datos">
            <summary>Ver como tabla</summary>
            <table>
              <thead><tr><th scope="col">Día</th><th scope="col">Préstamos</th></tr></thead>
              <tbody>
                <tr v-for="dia in metricas.porDia" :key="dia.fecha">
                  <td>{{ dia.etiqueta }}</td><td>{{ dia.cantidad }}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </template>
      </section>

      <div class="dos-columnas">
        <!-- Préstamos por sucursal -->
        <section class="panel">
          <h3>Préstamos por sucursal</h3>
          <ul class="barras-horizontales">
            <li v-for="s in metricas.porSucursal" :key="s.nombre">
              <span class="etiqueta">{{ s.nombre }}</span>
              <span class="pista"><span class="relleno" :style="{ width: porcentaje(s.cantidad, maxPorSucursal) }"></span></span>
              <span class="valor">{{ s.cantidad }}</span>
            </li>
          </ul>
        </section>

        <!-- Distribución de votos -->
        <section class="panel">
          <h3>Votos por cantidad de estrellas</h3>
          <p v-if="metricas.kpis.votos === 0" class="vacio">Todavía nadie calificó libros.</p>
          <ul v-else class="barras-horizontales">
            <li v-for="v in [...metricas.distribucionVotos].reverse()" :key="v.estrellas">
              <span class="etiqueta">{{ "★".repeat(v.estrellas) }}<span class="sr-only"> {{ v.estrellas }} estrellas</span></span>
              <span class="pista"><span class="relleno" :style="{ width: porcentaje(v.cantidad, maxVotos) }"></span></span>
              <span class="valor">{{ v.cantidad }}</span>
            </li>
          </ul>
        </section>
      </div>

      <div class="dos-columnas">
        <section class="panel">
          <h3>📚 Libros más pedidos</h3>
          <ol v-if="metricas.topLibros.length" class="ranking">
            <li v-for="l in metricas.topLibros" :key="l.clave">
              <span><strong>{{ l.titulo }}</strong> <span class="dim">· {{ l.autor }}</span></span>
              <span class="valor">{{ l.cantidad }}</span>
            </li>
          </ol>
          <p v-else class="vacio">Sin préstamos en este período.</p>
        </section>

        <section class="panel">
          <h3>👤 Lectores más activos</h3>
          <ol v-if="metricas.topLectores.length" class="ranking">
            <li v-for="l in metricas.topLectores" :key="l.clave">
              <span>{{ l.nombre }}</span>
              <span class="valor">{{ plural(l.cantidad, "préstamo", "préstamos") }}</span>
            </li>
          </ol>
          <p v-else class="vacio">Sin préstamos en este período.</p>
        </section>

        <section class="panel">
          <h3>⭐ Mejor valorados</h3>
          <ol v-if="metricas.mejorValorados.length" class="ranking">
            <li v-for="l in metricas.mejorValorados" :key="l.clave">
              <span>{{ l.titulo }}</span>
              <span class="valor">{{ formatearPuntaje(l.promedio) }} ({{ l.votos }})</span>
            </li>
          </ol>
          <p v-else class="vacio">Todavía nadie calificó libros.</p>
        </section>

        <section class="panel">
          <h3>📕 Agotados para reponer</h3>
          <ol v-if="metricas.agotadosConDemanda.length" class="ranking">
            <li v-for="l in metricas.agotadosConDemanda" :key="l.clave">
              <span>{{ l.titulo }}</span>
              <span class="valor">{{ plural(l.pedidos, "pedido", "pedidos") }}</span>
            </li>
          </ol>
          <p v-else class="vacio">
            {{ metricas.kpis.agotados
              ? `Hay ${plural(metricas.kpis.agotados, "libro agotado", "libros agotados")}, pero nadie los pidió.`
              : "No hay libros agotados." }}
          </p>
        </section>

        <section class="panel">
          <h3>🔎 Buscados sin encontrar</h3>
          <ol v-if="metricas.busquedasSinResultados.length" class="ranking">
            <li v-for="b in metricas.busquedasSinResultados" :key="b.clave">
              <span>«{{ b.clave }}»</span>
              <span class="valor">{{ plural(b.cantidad, "vez", "veces") }}</span>
            </li>
          </ol>
          <p v-else class="vacio">Todas las búsquedas encontraron algo.</p>
        </section>

        <section class="panel">
          <h3>🔍 Más buscados ({{ metricas.kpis.busquedas }})</h3>
          <ol v-if="metricas.masBuscadas.length" class="ranking">
            <li v-for="b in metricas.masBuscadas" :key="b.clave">
              <span>«{{ b.clave }}»</span>
              <span class="valor">{{ plural(b.cantidad, "vez", "veces") }}</span>
            </li>
          </ol>
          <p v-else class="vacio">Sin búsquedas en este período.</p>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
/* Color de las barras: naranja calabaza un poco más oscuro que el acento,
   validado para contraste y lectura sobre el fondo oscuro de las tarjetas */
.metricas {
  --color-grafico: #d9701a;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.encabezado {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.encabezado h2 {
  margin: 0;
}

.subtitulo {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.controles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.periodos {
  display: flex;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radio-pill);
  overflow: hidden;
}

.btn-periodo {
  min-height: 36px;
  padding: 4px 14px;
  border-radius: 0;
  background: none;
  color: var(--color-text-muted);
  font-weight: 600;
}

.btn-periodo.activo {
  background-color: var(--color-surface-alt);
  color: var(--color-text);
}

.btn-demo {
  min-height: 36px;
  padding: 4px 14px;
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border-light);
  color: var(--color-text);
  font-weight: 600;
}

.btn-demo[aria-pressed="true"] {
  border-color: var(--color-gold);
}

.aviso {
  margin: 0;
  padding: 10px 14px;
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radio);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.aviso-demo {
  border-color: var(--color-gold);
}

.kpis {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
  gap: 12px;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
}

.kpi.alerta {
  border-color: var(--color-danger);
}

.kpi-num {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-text);
  line-height: 1.1;
}

.kpi-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.panel {
  padding: 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  min-width: 0;
}

.panel h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.vacio {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.dim {
  color: var(--color-text-dim);
}

.dos-columnas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}

.conclusiones {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ---- Columnas por día ---- */
.grafico-dias {
  position: relative;
  padding: 18px 0 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.eje-max {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 0.7rem;
  color: var(--color-text-dim);
}

.barras-dias {
  list-style: none;
  margin: 0;
  padding: 0;
  height: 160px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  /* Línea guía tenue a la altura del máximo */
  border-top: 1px dashed var(--color-border);
}

.columna {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  outline: none;
}

.barra {
  width: 100%;
  min-height: 0;
  background-color: var(--color-grafico);
  border-radius: 4px 4px 0 0;
}

.columna:hover .barra,
.columna:focus-visible .barra {
  filter: brightness(1.2);
}

.columna:focus-visible {
  box-shadow: 0 0 0 2px var(--color-accent);
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: var(--radio-chico);
  background-color: var(--color-bg-deep);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  z-index: 1;
}

.tooltip strong {
  color: var(--color-text);
}

.columna:hover .tooltip,
.columna:focus-visible .tooltip {
  opacity: 1;
}

.etiqueta-x {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: var(--color-text-dim);
  white-space: nowrap;
}

.tabla-datos {
  margin-top: 12px;
  font-size: 0.85rem;
}

.tabla-datos summary {
  cursor: pointer;
  color: var(--color-accent);
}

.tabla-datos table {
  margin-top: 8px;
  border-collapse: collapse;
}

.tabla-datos th,
.tabla-datos td {
  padding: 2px 16px 2px 0;
  text-align: left;
}

/* ---- Barras horizontales ---- */
.barras-horizontales {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.barras-horizontales li {
  display: grid;
  grid-template-columns: 80px 1fr 32px;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
}

.etiqueta {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.pista {
  height: 12px;
  border-radius: 4px;
  background-color: var(--color-bg-nested);
}

.relleno {
  display: block;
  height: 100%;
  border-radius: 4px;
  background-color: var(--color-grafico);
}

.valor {
  color: var(--color-text);
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

/* ---- Rankings ---- */
.ranking {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}

.ranking li::marker {
  color: var(--color-text-dim);
}

.ranking li {
  padding-left: 4px;
  overflow-wrap: anywhere;
}

/* La cantidad va a la derecha de cada fila */
.ranking li .valor {
  float: right;
  margin-left: 12px;
}
</style>
