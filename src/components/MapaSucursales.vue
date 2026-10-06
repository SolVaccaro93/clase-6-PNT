<script setup>
// =========================================================================
// Requerimiento: Mapa interactivo de sucursales con libros - Sol
// =========================================================================
// Sin "libro": cada marcador muestra los libros disponibles en esa sucursal.
// Con "libro": cada marcador muestra el stock de ese libro (rojo = sin stock).
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
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

const COLOR_CON_STOCK = "#a3be8c";
const COLOR_SIN_STOCK = "#bf616a";
const MAX_LIBROS_POPUP = 5;

// Los títulos vienen de la API: se escapan antes de meterlos en el HTML del popup.
function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function cantidadEnSucursal(sucursal) {
  if (props.libro) {
    const item = BibliotecaService.consultarDisponibilidad(props.libro.id)
      .find((d) => d.sucursal.id === sucursal.id);
    return item ? item.cantidad : 0;
  }
  return BibliotecaService.getLibrosDisponiblesEnSucursal(sucursal.id).length;
}

function contenidoPopup(sucursal) {
  const encabezado = `<strong>${escaparHtml(sucursal.nombre)}</strong><br>${escaparHtml(sucursal.direccion)}`;

  if (props.libro) {
    const cantidad = cantidadEnSucursal(sucursal);
    const estado = cantidad > 0 ? `${cantidad} disponibles` : "Sin stock";
    return `${encabezado}<p class="popup-stock">${escaparHtml(props.libro.titulo)}: <strong>${estado}</strong></p>`;
  }

  const disponibles = BibliotecaService.getLibrosDisponiblesEnSucursal(sucursal.id);
  if (disponibles.length === 0) {
    return `${encabezado}<p class="popup-stock">Sin libros disponibles.</p>`;
  }

  const items = disponibles
    .slice(0, MAX_LIBROS_POPUP)
    .map((d) => `<li><a href="#/libros/${d.libro.id}">${escaparHtml(d.libro.titulo)}</a> (${d.cantidad})</li>`)
    .join("");
  const resto = disponibles.length > MAX_LIBROS_POPUP
    ? `<p class="popup-stock">y ${disponibles.length - MAX_LIBROS_POPUP} títulos más</p>`
    : "";

  return `${encabezado}<p class="popup-stock">${disponibles.length} títulos disponibles:</p><ul class="popup-libros">${items}</ul>${resto}`;
}

function pintarMarcadores() {
  marcadores.forEach(({ marcador, sucursal }) => {
    const color = cantidadEnSucursal(sucursal) > 0 ? COLOR_CON_STOCK : COLOR_SIN_STOCK;
    marcador.setStyle({ color, fillColor: color });
  });
}

onMounted(() => {
  mapa = L.map(contenedor.value, { scrollWheelZoom: false });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  const sedes = getSucursalesConUbicacion();
  marcadores = sedes.map((sucursal) => {
    const marcador = L.circleMarker([sucursal.latitud, sucursal.longitud], {
      radius: 12,
      weight: 2,
      fillOpacity: 0.8
    })
      // Función: el contenido se arma al abrir, así siempre muestra el stock actual.
      .bindPopup(() => contenidoPopup(sucursal))
      .bindTooltip(sucursal.nombre)
      .addTo(mapa);
    return { marcador, sucursal };
  });

  mapa.fitBounds(
    L.latLngBounds(sedes.map((s) => [s.latitud, s.longitud])),
    { padding: [40, 40] }
  );

  pintarMarcadores();
});

// Si alguien solicita un libro o el admin cambia stock, se recalculan los colores.
watch(cambiosStock, pintarMarcadores);

onBeforeUnmount(() => {
  mapa?.remove();
  mapa = null;
});
</script>

<template>
  <div class="mapa-wrapper">
    <div ref="contenedor" class="mapa" role="region" aria-label="Mapa de sucursales"></div>
    <p class="leyenda">
      <span class="punto con-stock"></span> Con stock
      <span class="punto sin-stock"></span> Sin stock
    </p>
  </div>
</template>

<style scoped>
.mapa {
  height: 360px;
  border-radius: 8px;
  border: 1px solid #3b4252;
  z-index: 0;
}

.leyenda {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: #d8dee9;
}

.punto {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.punto.sin-stock {
  margin-left: 12px;
}

.con-stock {
  background-color: #a3be8c;
}

.sin-stock {
  background-color: #bf616a;
}

/* El popup lo genera Leaflet fuera del scope del componente */
:deep(.popup-stock) {
  margin: 6px 0;
}

:deep(.popup-libros) {
  margin: 0;
  padding-left: 18px;
}
</style>
