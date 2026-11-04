<script setup>
import { ref, computed, onMounted } from "vue";
import { BibliotecaService, ORIGEN_ARGENTINA, ORIGEN_OTROS } from "../services/bibliotecaService.js";
import LibroCard from "../components/LibroCard.vue";

const busqueda = ref("");
const generoSeleccionado = ref("Todos");
const generos = ref(["Todos"]);

// Requerimiento: Buscar por cantidad de estrellas - Sol
const estrellasMinimas = ref(0);
const OPCIONES_ESTRELLAS = [
  { valor: 0, texto: "Todas" },
  { valor: 3, texto: "⭐ 3 o más" },
  { valor: 3.5, texto: "⭐ 3,5 o más" },
  { valor: 4, texto: "⭐ 4 o más" },
  { valor: 4.5, texto: "⭐ 4,5 o más" }
];

// Requerimiento: Buscar por cantidad de páginas - Sol
const rangoPaginas = ref("todas");
const OPCIONES_PAGINAS = [
  { valor: "todas", texto: "Todas", rango: null },
  { valor: "cortos", texto: "📄 Hasta 200", rango: { min: 0, max: 200 } },
  { valor: "medianos", texto: "📄 201 a 400", rango: { min: 201, max: 400 } },
  { valor: "largos", texto: "📄 Más de 400", rango: { min: 401, max: Infinity } }
];

// Requerimiento: Buscar por editorial, año de publicación e idioma
const editorialSeleccionada = ref("Todas");
const editoriales = ref(["Todas"]);
const idiomaSeleccionado = ref("Todos");
const idiomas = ref(["Todos"]);
// Vacío = sin límite; v-model.number deja "" cuando se borra el campo
const anioDesde = ref("");
const anioHasta = ref("");

// Tarea 14: Filtrar por origen - Sol
const origenSeleccionado = ref("Todos");
const ORIGENES = ["Todos", ORIGEN_ARGENTINA, ORIGEN_OTROS];

const libros = ref([]);
const isLoading = ref(true);
const error = ref("");

// Carga inicial desde la API: 25 libros generales más los de autores argentinos
async function cargarLibros() {
  isLoading.value = true;
  error.value = "";

  try {
    libros.value = await BibliotecaService.cargarLibros();
    generos.value = ["Todos", ...BibliotecaService.getGeneros()];
    editoriales.value = ["Todas", ...BibliotecaService.getEditoriales()];
    idiomas.value = ["Todos", ...BibliotecaService.getIdiomas()];
  } catch (e) {
    error.value = e.message || "Error al conectar con la API de OpenLibrary.";
  } finally {
    isLoading.value = false;
  }
}

// Filtrado de libros con el service acordado
const librosFiltrados = computed(() => {
  if (!libros.value.length) return [];
  const opcionPaginas = OPCIONES_PAGINAS.find((o) => o.valor === rangoPaginas.value);
  return BibliotecaService.buscar(
    busqueda.value,
    generoSeleccionado.value,
    estrellasMinimas.value,
    opcionPaginas?.rango ?? null,
    {
      editorial: editorialSeleccionada.value,
      idioma: idiomaSeleccionado.value,
      origen: origenSeleccionado.value,
      anioDesde: anioDesde.value,
      anioHasta: anioHasta.value
    }
  );
});

// ---- Panel de filtros: se despliega con un botón para no ocupar toda la pantalla ----
const panelAbierto = ref(false);

const textoAnio = computed(() => {
  const desde = Number.isFinite(anioDesde.value) ? anioDesde.value : null;
  const hasta = Number.isFinite(anioHasta.value) ? anioHasta.value : null;
  if (desde !== null && hasta !== null) return `Año: ${desde} a ${hasta}`;
  if (desde !== null) return `Año: desde ${desde}`;
  if (hasta !== null) return `Año: hasta ${hasta}`;
  return "";
});

// Filtros en uso: se muestran como chips y cada uno sabe cómo quitarse
const filtrosActivos = computed(() => {
  const activos = [];
  const agregar = (clave, texto, quitar) => activos.push({ clave, texto, quitar });

  if (generoSeleccionado.value !== "Todos") {
    agregar("genero", `Género: ${generoSeleccionado.value}`, () => (generoSeleccionado.value = "Todos"));
  }
  if (origenSeleccionado.value !== "Todos") {
    agregar("origen", `Origen: ${origenSeleccionado.value}`, () => (origenSeleccionado.value = "Todos"));
  }
  if (idiomaSeleccionado.value !== "Todos") {
    agregar("idioma", `Idioma: ${idiomaSeleccionado.value}`, () => (idiomaSeleccionado.value = "Todos"));
  }
  if (editorialSeleccionada.value !== "Todas") {
    agregar("editorial", `Editorial: ${editorialSeleccionada.value}`, () => (editorialSeleccionada.value = "Todas"));
  }
  if (estrellasMinimas.value !== 0) {
    const opcion = OPCIONES_ESTRELLAS.find((o) => o.valor === estrellasMinimas.value);
    agregar("estrellas", opcion.texto, () => (estrellasMinimas.value = 0));
  }
  if (rangoPaginas.value !== "todas") {
    const opcion = OPCIONES_PAGINAS.find((o) => o.valor === rangoPaginas.value);
    agregar("paginas", opcion.texto, () => (rangoPaginas.value = "todas"));
  }
  if (textoAnio.value) {
    agregar("anio", textoAnio.value, () => {
      anioDesde.value = "";
      anioHasta.value = "";
    });
  }
  return activos;
});

function limpiarFiltros() {
  filtrosActivos.value.forEach((filtro) => filtro.quitar());
  busqueda.value = "";
}

onMounted(() => {
  cargarLibros();
});
</script>

<template>
  <section aria-labelledby="titulo-listado">
    <h2 id="titulo-listado">Listado de libros</h2>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="estado" role="status">
      <p>Cargando libros desde OpenLibrary...</p>
    </div>

    <!-- Estado de error con reintento -->
    <div v-else-if="error" class="estado error" role="alert">
      <p>{{ error }}</p>
      <button @click="cargarLibros">Reintentar</button>
    </div>

    <!-- Contenido principal -->
    <div v-else>
      <!-- Filtros de búsqueda (tarea de Patricio) -->
      <div class="barra-busqueda">
        <label class="campo campo-busqueda">
          <span class="sr-only">Buscar libro</span>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar por título o autor..."
          />
        </label>

        <button
          type="button"
          class="btn-filtros"
          :class="{ activo: panelAbierto }"
          :aria-expanded="panelAbierto"
          aria-controls="panel-filtros"
          @click="panelAbierto = !panelAbierto"
        >
          Filtros
          <span v-if="filtrosActivos.length" class="contador-filtros">
            {{ filtrosActivos.length }}<span class="sr-only"> activos</span>
          </span>
          <span class="flecha" aria-hidden="true">{{ panelAbierto ? "▴" : "▾" }}</span>
        </button>
      </div>

      <div v-show="panelAbierto" id="panel-filtros" class="panel-filtros">
        <label class="campo">
          <span>Género</span>
          <select v-model="generoSeleccionado">
            <option v-for="genero in generos" :key="genero" :value="genero">
              {{ genero }}
            </option>
          </select>
        </label>

        <label class="campo">
          <span>Origen</span>
          <select v-model="origenSeleccionado">
            <option v-for="origen in ORIGENES" :key="origen" :value="origen">
              {{ origen }}
            </option>
          </select>
        </label>

        <label class="campo">
          <span>Idioma</span>
          <select v-model="idiomaSeleccionado">
            <option v-for="idioma in idiomas" :key="idioma" :value="idioma">
              {{ idioma }}
            </option>
          </select>
        </label>

        <label class="campo">
          <span>Editorial</span>
          <select v-model="editorialSeleccionada">
            <option v-for="editorial in editoriales" :key="editorial" :value="editorial">
              {{ editorial }}
            </option>
          </select>
        </label>

        <label class="campo">
          <span>Estrellas</span>
          <select v-model.number="estrellasMinimas">
            <option v-for="opcion in OPCIONES_ESTRELLAS" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.texto }}
            </option>
          </select>
        </label>

        <label class="campo">
          <span>Páginas</span>
          <select v-model="rangoPaginas">
            <option v-for="opcion in OPCIONES_PAGINAS" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.texto }}
            </option>
          </select>
        </label>

        <fieldset class="campo campo-anios">
          <legend>Año de publicación</legend>
          <div class="rango-anios">
            <input v-model.number="anioDesde" type="number" inputmode="numeric" placeholder="Desde" aria-label="Año desde" />
            <span aria-hidden="true">–</span>
            <input v-model.number="anioHasta" type="number" inputmode="numeric" placeholder="Hasta" aria-label="Año hasta" />
          </div>
        </fieldset>
      </div>

      <!-- Resultado y filtros en uso: lo elegido siempre queda a la vista -->
      <div class="resumen-filtros">
        <p class="contador-resultados" role="status">
          <strong>{{ librosFiltrados.length }}</strong> de {{ libros.length }} libros
        </p>
        <ul v-if="filtrosActivos.length" class="chips-activos" aria-label="Filtros activos">
          <li v-for="filtro in filtrosActivos" :key="filtro.clave">
            <button
              type="button"
              class="chip-activo"
              :aria-label="`Quitar filtro ${filtro.texto}`"
              @click="filtro.quitar()"
            >
              {{ filtro.texto }} <span aria-hidden="true">✕</span>
            </button>
          </li>
        </ul>
        <button
          v-if="filtrosActivos.length > 1"
          type="button"
          class="btn-limpiar"
          @click="limpiarFiltros"
        >
          Limpiar todo
        </button>
      </div>

      <!-- Grilla de libros -->
      <div v-if="librosFiltrados.length === 0" class="estado" role="status">
        <p>No se encontraron libros con esa búsqueda.</p>
        <button type="button" @click="limpiarFiltros">Limpiar búsqueda y filtros</button>
      </div>

      <div v-else class="grilla">
        <LibroCard
          v-for="libro in librosFiltrados"
          :key="libro.id"
          :libro="libro"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.barra-busqueda {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.campo-busqueda {
  flex: 1;
}

.campo-busqueda input {
  width: 100%;
}

.btn-filtros {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-surface-alt);
  border: 1px solid var(--color-border-light);
  color: var(--color-text);
}

.btn-filtros:hover,
.btn-filtros.activo {
  background-color: var(--color-border);
  border-color: var(--color-accent);
}

.contador-filtros {
  min-width: 20px;
  padding: 0 6px;
  border-radius: var(--radio-pill);
  background-color: var(--color-accent);
  color: var(--color-bg-deep);
  font-size: 0.75rem;
  line-height: 20px;
  text-align: center;
}

.flecha {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.panel-filtros {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: 14px;
  margin-bottom: 12px;
  padding: 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
}

.panel-filtros select {
  width: 100%;
}

/* El rango de años ocupa dos columnas: desde y hasta quedan juntos */
.campo-anios {
  grid-column: span 2;
  margin: 0;
  padding: 0;
  border: none;
}

.campo-anios legend {
  padding: 0;
  margin-bottom: 6px;
}

.rango-anios {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rango-anios input {
  flex: 1;
  width: 100%;
}

.resumen-filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-bottom: 20px;
}

.contador-resultados {
  margin: 0;
  font-size: 0.9rem;
}

.contador-resultados strong {
  color: var(--color-text);
}

.chips-activos {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
}

.chip-activo {
  min-height: 30px;
  padding: 2px 10px;
  border-radius: var(--radio-pill);
  background-color: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
}

.chip-activo:hover {
  background-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.btn-limpiar {
  min-height: 30px;
  padding: 2px 6px;
  background: none;
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
}

.btn-limpiar:hover {
  background: none;
  color: var(--color-accent-light);
}

.grilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 16px;
}

p {
  color: var(--color-text-muted);
}

/* En celular, el rango de años no necesita dos columnas */
@media (max-width: 480px) {
  .campo-anios {
    grid-column: auto;
  }
}
</style>
