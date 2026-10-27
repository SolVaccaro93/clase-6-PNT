<script setup>
// =========================================================================
// Requerimiento: Mapa interactivo de sucursales con libros - Sol
// =========================================================================
// Sin "libro": cada marcador muestra los libros disponibles en esa sucursal.
// Con "libro": cada marcador muestra el stock de ese libro.
// Si no hay sucursales o nada disponible, en lugar del mapa se muestra un aviso.
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BibliotecaService, cambiosStock } from "../services/bibliotecaService.js";
import { getSucursalesConUbicacion } from "../services/ubicacionesSucursales.js";

const props = defineProps({
  libro: { type: Object, default: null }
});

const contenedor = ref(null);
let mapa = null;
let marcadores = [];

const MAX_LIBROS_POPUP = 5;
const sedes = getSucursalesConUbicacion();

// Los títulos vienen de la API: se escapan antes de meterlos en el HTML del popup.
function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// Ejemplares del libro (modo detalle) o títulos disponibles (modo general) en una sucursal
function cantidadEnSucursal(sucursal) {
  if (props.libro) {
    const item = BibliotecaService.consultarDisponibilidad(props.libro.id)
      .find((d) => d.sucursal.id === sucursal.id);
    return item ? item.cantidad : 0;
  }
  return BibliotecaService.getLibrosDisponiblesEnSucursal(sucursal.id).length;
}

// Se recalcula cada vez que cambia el stock (retiros, devoluciones o el admin).
const sedesConStock = computed(() => {
  cambiosStock.value;
  return sedes.filter((s) => cantidadEnSucursal(s) > 0).length;
});

const sedesSinStock = computed(() => sedes.length - sedesConStock.value);

// ---- Información de "Sin stock" relacionada con los libros ----
// Modo general: stock de cada título del catálogo en cada sucursal.
const stockPorTitulo = computed(() => {
  cambiosStock.value;
  if (props.libro) return [];
  return BibliotecaService.buscar().map((libro) => {
    const porSede = BibliotecaService.consultarDisponibilidad(libro.id)
      .filter((d) => sedes.some((s) => s.id === d.sucursal.id));
    return {
      libro,
      porSede,
      agotadoEnTodas: porSede.every((d) => d.cantidad === 0)
    };
  });
});

const titulosConStock = computed(() => stockPorTitulo.value.filter((t) => !t.agotadoEnTodas).length);

// Títulos que faltan en al menos una sucursal; primero los agotados en todas.
const titulosSinStock = computed(() =>
  stockPorTitulo.value
    .filter((t) => t.porSede.some((d) => d.cantidad === 0))
    .sort((a, b) => Number(b.agotadoEnTodas) - Number(a.agotadoEnTodas))
);

// Modo detalle: sucursales sin el libro y dónde sí está.
const sucursalesSinEjemplares = computed(() => {
  cambiosStock.value;
  return props.libro ? sedes.filter((s) => cantidadEnSucursal(s) === 0) : [];
});

const sucursalesConEjemplares = computed(() => {
  cambiosStock.value;
  return props.libro
    ? sedes.map((s) => ({ ...s, cantidad: cantidadEnSucursal(s) })).filter((s) => s.cantidad > 0)
    : [];
});

// Lo que cuentan los chips: sucursales en el detalle, títulos en el mapa general
const chips = computed(() =>
  props.libro
    ? { con: sedesConStock.value, sin: sedesSinStock.value, unidad: "sucursales" }
    : { con: titulosConStock.value, sin: titulosSinStock.value.length, unidad: "títulos" }
);

// Modo general: sucursales con títulos disponibles, de la que más tiene a la que menos
const sedesConTitulos = computed(() => {
  cambiosStock.value;
  if (props.libro) return [];
  return sedes
    .map((s) => ({ ...s, titulos: BibliotecaService.getLibrosDisponiblesEnSucursal(s.id).length }))
    .filter((s) => s.titulos > 0)
    .sort((a, b) => b.titulos - a.titulos);
});

// ---- Chips interactivos ----
// Chip elegido: "con", "sin" o null (ninguno). Filtra los pines y abre su panel.
const filtro = ref(null);

function alternarFiltro(valor) {
  filtro.value = filtro.value === valor ? null : valor;
}

// ¿El pin de esta sucursal coincide con el chip elegido?
function coincideConFiltro(sucursal) {
  if (!filtro.value) return true;
  if (props.libro) {
    const hay = cantidadEnSucursal(sucursal) > 0;
    return filtro.value === "con" ? hay : !hay;
  }
  const disponibles = BibliotecaService.getLibrosDisponiblesEnSucursal(sucursal.id).length;
  return filtro.value === "con"
    ? disponibles > 0
    : disponibles < BibliotecaService.buscar().length; // tiene algún título agotado
}

// Porcentaje de sucursales con stock, para la barra de la leyenda
const porcentajeConStock = computed(() =>
  sedes.length ? Math.round((sedesConStock.value / sedes.length) * 100) : 0
);

const mostrarMapa = computed(() => sedes.length > 0 && sedesConStock.value > 0);

const mensajeVacio = computed(() => {
  if (sedes.length === 0) return "Todavía no hay sucursales cargadas para mostrar en el mapa.";
  if (props.libro) return "Este libro no tiene ejemplares disponibles en ninguna sucursal por ahora.";
  return "Ninguna sucursal tiene libros disponibles por ahora.";
});

// Pin con forma de gota, ícono de libros y un globito con la cantidad
function icono(sucursal) {
  const cantidad = cantidadEnSucursal(sucursal);
  const estado = cantidad > 0 ? "con-stock" : "sin-stock";
  return L.divIcon({
    className: "pin-sucursal",
    html: `<div class="pin ${estado}">
        <span class="pin-forma"></span>
        <span class="pin-icono">${cantidad > 0 ? "📚" : "📕"}</span>
        <span class="pin-badge">${cantidad}</span>
      </div>`,
    iconSize: [40, 44],
    iconAnchor: [20, 42],
    popupAnchor: [0, -38],
    tooltipAnchor: [16, -24]
  });
}

function contenidoPopup(sucursal) {
  const encabezado = `<strong class="popup-titulo">📍 ${escaparHtml(sucursal.nombre)}</strong><span class="popup-direccion">${escaparHtml(sucursal.direccion)}</span>`;

  if (props.libro) {
    const cantidad = cantidadEnSucursal(sucursal);
    const estado = cantidad > 0
      ? `✅ ${cantidad} ${cantidad === 1 ? "ejemplar disponible" : "ejemplares disponibles"}`
      : "❌ Sin stock en esta sucursal";
    return `${encabezado}<p class="popup-stock">${estado}</p>`;
  }

  const disponibles = BibliotecaService.getLibrosDisponiblesEnSucursal(sucursal.id);
  if (disponibles.length === 0) {
    return `${encabezado}<p class="popup-stock">❌ Sin libros disponibles.</p>`;
  }

  const itemLibro = (d) =>
    `<li><a href="#/libros/${d.libro.id}">${escaparHtml(d.libro.titulo)}</a> (${d.cantidad})</li>`;
  const primeros = disponibles.slice(0, MAX_LIBROS_POPUP).map(itemLibro).join("");
  const restantes = disponibles.slice(MAX_LIBROS_POPUP);

  // <details> despliega el resto de la lista al tocar "Ver N títulos más", sin JavaScript.
  const resto = restantes.length
    ? `<details class="popup-mas">
        <summary>Ver ${restantes.length} ${restantes.length === 1 ? "título más" : "títulos más"}</summary>
        <ul class="popup-libros">${restantes.map(itemLibro).join("")}</ul>
      </details>`
    : "";

  const agotadosAca = BibliotecaService.buscar().length - disponibles.length;
  const lineaAgotados = agotadosAca > 0
    ? `<p class="popup-agotados">📕 ${agotadosAca} ${agotadosAca === 1 ? "título agotado" : "títulos agotados"} en esta sucursal</p>`
    : "";

  return `${encabezado}<p class="popup-stock">📚 ${disponibles.length} títulos disponibles:</p><ul class="popup-libros">${primeros}</ul>${resto}${lineaAgotados}`;
}

function crearMapa() {
  mapa = L.map(contenedor.value, { scrollWheelZoom: false });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  marcadores = sedes.map((sucursal) => {
    const marcador = L.marker([sucursal.latitud, sucursal.longitud], {
      icon: icono(sucursal),
      alt: `Sucursal ${sucursal.nombre}`
    })
      // maxHeight: con la lista desplegada, el popup scrollea en vez de salirse del mapa.
      .bindPopup("", { maxWidth: 260, maxHeight: 230 })
      // El contenido se arma al abrir, así siempre muestra el stock actual.
      .on("popupopen", (e) => {
        const contenido = document.createElement("div");
        contenido.innerHTML = contenidoPopup(sucursal);
        // Al desplegar "Ver N títulos más", Leaflet recalcula el tamaño y mueve el mapa
        // para que el popup no quede cortado. Como es el mismo elemento, no se cierra.
        // Dos update(): después del primer auto-pan al abrir, Leaflet ignora el siguiente;
        // el primero consume ese aviso y el segundo mueve el mapa.
        contenido.querySelector("details")?.addEventListener("toggle", () => {
          e.popup.update();
          e.popup.update();
        });
        e.popup.setContent(contenido);
      })
      .bindTooltip(sucursal.nombre)
      .addTo(mapa);
    return { marcador, sucursal };
  });

  encuadrar(sedes, false);
  resaltarPines();
}

// Ajusta el mapa para que se vean esas sucursales.
// maxZoom evita que se acerque demasiado cuando hay una sola.
function encuadrar(lista, animado = true) {
  if (!mapa || lista.length === 0) return;
  const limites = L.latLngBounds(lista.map((s) => [s.latitud, s.longitud]));
  const opciones = { padding: [50, 50], maxZoom: 15 };
  if (animado) mapa.flyToBounds(limites, { ...opciones, duration: 0.6 });
  else mapa.fitBounds(limites, opciones);
}

// Los pines que no coinciden con el chip elegido quedan atenuados y por detrás.
function resaltarPines() {
  marcadores.forEach(({ marcador, sucursal }) => {
    const coincide = coincideConFiltro(sucursal);
    marcador.setOpacity(coincide ? 1 : 0.3);
    marcador.setZIndexOffset(coincide ? 1000 : 0);
  });
}

// Al elegir o quitar un chip: resalta los pines y acerca el mapa a los que coinciden.
function aplicarFiltro() {
  if (!mapa) return;
  mapa.closePopup();
  resaltarPines();
  const coinciden = sedes.filter(coincideConFiltro);
  encuadrar(coinciden.length ? coinciden : sedes);
}

// Botón "Ver en el mapa" del panel: centra esa sucursal y abre su popup.
function verEnMapa(idSucursal) {
  const item = marcadores.find((m) => m.sucursal.id === idSucursal);
  if (!item) return;
  contenedor.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  mapa.setView(item.marcador.getLatLng(), 15);
  item.marcador.openPopup();
}

function destruirMapa() {
  mapa?.remove();
  mapa = null;
  marcadores = [];
}

// Crea, actualiza o quita el mapa según haya algo disponible para mostrar.
function actualizarMapa() {
  if (!mostrarMapa.value) {
    destruirMapa();
    return;
  }
  if (!mapa) {
    crearMapa();
    return;
  }
  marcadores.forEach(({ marcador, sucursal }) => marcador.setIcon(icono(sucursal)));
  resaltarPines();
}

onMounted(actualizarMapa);

// flush "post": espera a que Vue muestre u oculte el contenedor antes de tocar el mapa.
watch([mostrarMapa, cambiosStock], actualizarMapa, { flush: "post" });
watch(filtro, aplicarFiltro);

onBeforeUnmount(destruirMapa);
</script>

<template>
  <div class="mapa-wrapper">
    <template v-if="mostrarMapa">
      <div ref="contenedor" class="mapa" role="region" aria-label="Mapa de sucursales"></div>
      <!-- Leyenda: los chips filtran el mapa y abren un panel con el detalle -->
      <div class="leyenda">
        <ul class="chips-leyenda" aria-label="Filtrar el mapa por stock">
          <li>
            <button
              type="button"
              class="chip-leyenda con-stock"
              :class="{ activo: filtro === 'con', apagado: chips.con === 0 }"
              :aria-pressed="filtro === 'con'"
              aria-controls="panel-stock"
              :title="`${chips.con} ${chips.unidad} con stock`"
              @click="alternarFiltro('con')"
            >
              <span class="mini-pin" aria-hidden="true"><span>📚</span></span>
              Con stock
              <span class="contador">{{ chips.con }}</span>
              <span class="flecha" aria-hidden="true">{{ filtro === "con" ? "▴" : "▾" }}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              class="chip-leyenda sin-stock"
              :class="{ activo: filtro === 'sin', apagado: chips.sin === 0 }"
              :aria-pressed="filtro === 'sin'"
              aria-controls="panel-stock"
              :title="`${chips.sin} ${chips.unidad} sin stock`"
              @click="alternarFiltro('sin')"
            >
              <span class="mini-pin" aria-hidden="true"><span>📕</span></span>
              Sin stock
              <span class="contador">{{ chips.sin }}</span>
              <span class="flecha" aria-hidden="true">{{ filtro === "sin" ? "▴" : "▾" }}</span>
            </button>
          </li>
        </ul>

        <div class="resumen">
          <span>
            <strong>{{ sedesConStock }} de {{ sedes.length }}</strong>
            sucursales con {{ libro ? "ejemplares" : "libros" }}
          </span>
          <span
            class="barra"
            role="progressbar"
            :aria-valuenow="porcentajeConStock"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${porcentajeConStock}% de las sucursales con stock`"
          >
            <span class="relleno" :style="{ width: `${porcentajeConStock}%` }"></span>
          </span>
        </div>
      </div>

      <!-- Panel del chip elegido, con información de los libros -->
      <section v-if="filtro" id="panel-stock" class="panel-stock" :class="filtro" aria-live="polite">
        <button type="button" class="btn-cerrar" aria-label="Cerrar panel" @click="filtro = null">✕</button>

        <!-- ===== Detalle del libro ===== -->
        <template v-if="libro && filtro === 'con'">
          <h4>📚 Dónde retirar «{{ libro.titulo }}»</h4>
          <ul class="lista-sedes">
            <li v-for="sede in sucursalesConEjemplares" :key="sede.id">
              <strong>{{ sede.nombre }}</strong>
              <span class="dim">{{ sede.direccion }}</span>
              <span class="cantidad-sede hay">
                {{ sede.cantidad }} {{ sede.cantidad === 1 ? "ejemplar" : "ejemplares" }}
              </span>
              <button type="button" class="btn-ver" @click="verEnMapa(sede.id)">📍 Ver en el mapa</button>
            </li>
          </ul>
        </template>

        <template v-else-if="libro && filtro === 'sin'">
          <template v-if="sucursalesSinEjemplares.length">
            <h4>📕 Sin ejemplares de «{{ libro.titulo }}»</h4>
            <ul class="lista-sedes">
              <li v-for="sede in sucursalesSinEjemplares" :key="sede.id">
                <strong>{{ sede.nombre }}</strong>
                <span class="dim">{{ sede.direccion }}</span>
                <span class="cantidad-sede falta">Agotado</span>
                <button type="button" class="btn-ver" @click="verEnMapa(sede.id)">📍 Ver en el mapa</button>
              </li>
            </ul>
            <p class="sugerencia">
              ✅ Lo podés retirar en
              <template v-for="(sede, i) in sucursalesConEjemplares" :key="sede.id">
                <strong>{{ sede.nombre }}</strong> ({{ sede.cantidad }}){{ i < sucursalesConEjemplares.length - 1 ? ", " : "." }}
              </template>
            </p>
          </template>
          <p v-else class="todo-ok">🎉 Todas las sucursales tienen ejemplares de este libro.</p>
        </template>

        <!-- ===== Mapa general ===== -->
        <template v-else-if="filtro === 'con'">
          <h4>📚 {{ chips.con }} títulos con stock</h4>
          <p class="subtitulo-panel">Cuántos hay disponibles en cada sucursal:</p>
          <ul class="lista-sedes">
            <li v-for="sede in sedesConTitulos" :key="sede.id">
              <strong>{{ sede.nombre }}</strong>
              <span class="dim">{{ sede.direccion }}</span>
              <span class="cantidad-sede hay">{{ sede.titulos }} títulos disponibles</span>
              <button type="button" class="btn-ver" @click="verEnMapa(sede.id)">📍 Ver en el mapa</button>
            </li>
          </ul>
        </template>

        <template v-else-if="titulosSinStock.length === 0">
          <p class="todo-ok">🎉 Todos los títulos tienen stock en todas las sucursales.</p>
        </template>

        <!-- Mapa general: títulos que faltan en alguna sucursal -->
        <template v-else>
          <h4>📕 Títulos sin stock en alguna sucursal</h4>
          <ul class="lista-titulos">
            <li v-for="item in titulosSinStock" :key="item.libro.id">
              <img
                v-if="item.libro.portada"
                :src="item.libro.portada"
                alt=""
                class="miniatura"
                loading="lazy"
              />
              <span v-else class="miniatura sin-portada" aria-hidden="true">📖</span>
              <div class="info-titulo">
                <RouterLink :to="{ name: 'detalle', params: { id: item.libro.id } }">{{ item.libro.titulo }}</RouterLink>
                <span class="dim">{{ item.libro.autor }}</span>
                <span v-if="item.agotadoEnTodas" class="etiqueta-agotado">Agotado en todas las sucursales</span>
                <ul class="estado-sedes" :aria-label="`Stock de ${item.libro.titulo} por sucursal`">
                  <li
                    v-for="d in item.porSede"
                    :key="d.sucursal.id"
                    :class="d.cantidad > 0 ? 'hay' : 'falta'"
                  >
                    {{ d.sucursal.nombre }}: {{ d.cantidad > 0 ? d.cantidad : "agotado" }}
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </template>
      </section>
    </template>

    <div v-else class="sin-mapa" role="status">
      <span class="icono-vacio" aria-hidden="true">🗺️</span>
      <p>{{ mensajeVacio }}</p>
      <RouterLink v-if="libro" :to="{ name: 'listado' }">Ver otros libros del catálogo</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.mapa {
  height: 360px;
  border-radius: var(--radio);
  border: 1px solid var(--color-border);
  z-index: 0;
}

.leyenda {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  margin-top: 12px;
  padding: 10px 14px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.chips-leyenda {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Los chips son botones: se pisan los estilos globales de <button> */
.chip-leyenda {
  --color-estado: var(--color-success);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 4px 10px 4px 8px;
  border-radius: var(--radio-pill);
  border: 1px solid color-mix(in srgb, var(--color-estado) 55%, transparent);
  background-color: color-mix(in srgb, var(--color-estado) 14%, transparent);
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--transicion-rapida, 120ms ease),
    box-shadow var(--transicion-rapida, 120ms ease),
    transform var(--transicion-rapida, 120ms ease);
}

.chip-leyenda.sin-stock {
  --color-estado: var(--color-danger);
}

.chip-leyenda:hover {
  background-color: color-mix(in srgb, var(--color-estado) 28%, transparent);
  transform: translateY(-1px);
}

.chip-leyenda:active {
  transform: translateY(0);
}

/* Chip elegido: relleno más fuerte y un aro del color del estado */
.chip-leyenda.activo {
  background-color: color-mix(in srgb, var(--color-estado) 34%, transparent);
  border-color: var(--color-estado);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-estado) 45%, transparent);
}

.flecha {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Si no hay nada en ese estado, el chip queda atenuado (pero se puede tocar) */
.chip-leyenda.apagado:not(.activo) {
  opacity: 0.55;
}

/* Misma forma de gota que los pines del mapa, en chiquito */
.mini-pin {
  width: 18px;
  height: 18px;
  margin: 0 2px 2px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background-color: var(--color-estado);
  border: 1.5px solid var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.mini-pin span {
  transform: rotate(45deg);
  font-size: 9px;
  line-height: 1;
}

.contador {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radio-pill);
  background-color: var(--color-estado);
  color: var(--color-bg-deep);
  font-size: 0.75rem;
  font-weight: bold;
  line-height: 22px;
  text-align: center;
}

.resumen {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  color: var(--color-text-dim);
}

.resumen strong {
  color: var(--color-text);
}

.barra {
  width: 160px;
  height: 6px;
  border-radius: var(--radio-pill);
  background-color: color-mix(in srgb, var(--color-danger) 45%, transparent);
  overflow: hidden;
}

.relleno {
  display: block;
  height: 100%;
  border-radius: inherit;
  background-color: var(--color-success);
  transition: width 300ms ease;
}

/* ---- Panel "Sin stock" ---- */
.panel-stock {
  --color-estado: var(--color-success);
  position: relative;
  margin-top: 8px;
  padding: 14px;
  background-color: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-estado) 45%, transparent);
  border-radius: var(--radio);
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.panel-stock.sin {
  --color-estado: var(--color-danger);
}

.panel-stock h4 {
  margin: 0 36px 10px 0;
  font-size: 0.95rem;
  color: var(--color-text);
}

.btn-cerrar {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  min-height: 0;
  padding: 0;
  border-radius: 50%;
  background-color: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.btn-cerrar:hover {
  background-color: var(--color-surface-alt);
  color: var(--color-text);
}

.subtitulo-panel {
  margin: -4px 0 10px;
}

.todo-ok {
  margin: 0;
  padding-right: 36px;
  color: var(--color-text);
}

.dim {
  color: var(--color-text-dim);
}

.lista-sedes,
.lista-titulos,
.estado-sedes {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lista-sedes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lista-sedes li {
  flex: 1 1 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--radio-chico);
  background-color: var(--color-bg-nested);
}

.cantidad-sede {
  font-weight: 600;
}

.cantidad-sede.hay {
  color: var(--color-success);
}

.cantidad-sede.falta {
  color: var(--color-danger-soft);
}

.btn-ver {
  align-self: flex-start;
  margin-top: 6px;
  min-height: 32px;
  padding: 4px 10px;
  border-radius: var(--radio-chico);
  border: 1px solid var(--color-border-light);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-ver:hover {
  background-color: var(--color-border-hover);
}

.lista-sedes strong {
  color: var(--color-text);
}

.sugerencia {
  margin: 12px 0 0;
}

.sugerencia strong {
  color: var(--color-success);
}

/* Lista de títulos: scrollea si es larga para no estirar la página */
.lista-titulos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.lista-titulos > li {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radio-chico);
  background-color: var(--color-bg-nested);
}

.miniatura {
  flex-shrink: 0;
  width: 36px;
  height: 52px;
  object-fit: cover;
  border-radius: 4px;
  background-color: var(--color-surface-alt);
}

.miniatura.sin-portada {
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-titulo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.info-titulo a {
  font-weight: 600;
}

.etiqueta-agotado {
  align-self: flex-start;
  margin-top: 2px;
  padding: 1px 8px;
  border-radius: var(--radio-pill);
  background-color: color-mix(in srgb, var(--color-danger) 25%, transparent);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 600;
}

.estado-sedes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 4px;
  font-size: 0.78rem;
}

.estado-sedes .hay {
  color: var(--color-success);
}

.estado-sedes .falta {
  color: var(--color-danger-soft);
}

:deep(.popup-agotados) {
  margin: 8px 0 0;
  padding-top: 6px;
  border-top: 1px solid #e3e3e3;
  color: #9b2f40;
  font-size: 0.8rem;
}

/* En pantallas chicas el resumen pasa abajo, alineado a la izquierda */
@media (max-width: 520px) {
  .resumen {
    align-items: flex-start;
    width: 100%;
  }

  .barra {
    width: 100%;
  }
}

.sin-mapa {
  background-color: var(--color-surface);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radio);
  padding: 28px 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.sin-mapa p {
  margin: 8px 0;
}

.icono-vacio {
  font-size: 2rem;
}

/* ---- Marcadores y popups: los genera Leaflet dentro del mapa, por eso :deep ---- */
:deep(.pin-sucursal) {
  background: none;
  border: none;
}

:deep(.pin) {
  position: relative;
  width: 40px;
  height: 44px;
  transition: transform var(--transicion-rapida, 120ms ease);
}

:deep(.pin:hover) {
  transform: scale(1.12);
}

/* Cuadrado con una esquina en punta, rotado: queda con forma de gota invertida */
:deep(.pin-forma) {
  position: absolute;
  left: 5px;
  top: 2px;
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 2px solid var(--color-text);
  box-shadow: var(--sombra-chica);
}

:deep(.pin.con-stock .pin-forma) {
  background-color: var(--color-success);
}

:deep(.pin.sin-stock .pin-forma) {
  background-color: var(--color-danger);
}

:deep(.pin.sin-stock) {
  opacity: 0.85;
}

:deep(.pin-icono) {
  position: absolute;
  left: 0;
  right: 0;
  top: 8px;
  text-align: center;
  font-size: 15px;
  line-height: 1;
}

:deep(.pin-badge) {
  position: absolute;
  top: -6px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--radio-pill);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border-light);
  color: var(--color-text);
  font-size: 11px;
  font-weight: bold;
  line-height: 16px;
  text-align: center;
}

:deep(.popup-titulo) {
  display: block;
  font-size: 0.95rem;
}

:deep(.popup-direccion) {
  display: block;
  color: #555;
  font-size: 0.8rem;
}

:deep(.popup-stock) {
  margin: 6px 0;
}

:deep(.popup-libros) {
  margin: 0;
  padding-left: 18px;
}

:deep(.popup-mas) {
  margin-top: 6px;
}

:deep(.popup-mas summary) {
  cursor: pointer;
  font-weight: 600;
  color: #0078a8;
  list-style-position: inside;
}

:deep(.popup-mas summary:hover) {
  text-decoration: underline;
}

:deep(.popup-mas[open] summary) {
  margin-bottom: 4px;
}</style>
