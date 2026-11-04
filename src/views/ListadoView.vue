<script setup>
import { ref, computed, onMounted } from "vue";
import { BibliotecaService, ORIGEN_ARGENTINA, ORIGEN_OTROS } from "../services/bibliotecaService.js";
import LibroCard from "../components/LibroCard.vue";

const CLAVE_PREFERENCIAS_QUIZ = "biblioteca_preferencias_lectura";
const ANIO_ACTUAL = new Date().getFullYear();

const busqueda = ref("");
const generoSeleccionado = ref("Todos");
const generos = ref(["Todos"]);
const idiomasQuiz = ref([]);
const errorQuiz = ref("");
const preferencias = ref(leerPreferencias());
const quizAbierto = ref(!preferencias.value);
const generoQuiz = ref(preferencias.value?.genero || "");
const idiomaQuiz = ref(preferencias.value?.idioma || "");
const anioDesdeQuiz = ref(preferencias.value?.anioDesde ?? 1950);
const anioHastaQuiz = ref(preferencias.value?.anioHasta ?? 2000);

function leerPreferencias() {
  try {
    const guardadas = localStorage.getItem(CLAVE_PREFERENCIAS_QUIZ);
    if (!guardadas) return null;

    const preferenciasGuardadas = JSON.parse(guardadas);
    const { genero, idioma, anioDesde, anioHasta } = preferenciasGuardadas;
    if (
      typeof genero === "string" &&
      typeof idioma === "string" &&
      Number.isInteger(anioDesde) &&
      Number.isInteger(anioHasta) &&
      anioDesde >= 0 &&
      anioDesde <= anioHasta &&
      anioHasta <= ANIO_ACTUAL
    ) {
      return preferenciasGuardadas;
    }

    return null;
  } catch {
    errorQuiz.value = "No se pudieron leer tus gustos guardados. Completá el quiz nuevamente.";
    return null;
  }
}

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
    idiomasQuiz.value = BibliotecaService.getIdiomas();

    if (!generoQuiz.value || !generos.value.includes(generoQuiz.value)) {
      generoQuiz.value = generos.value[1] || "";
    }
    if (!idiomaQuiz.value || !idiomasQuiz.value.includes(idiomaQuiz.value)) {
      idiomaQuiz.value = idiomasQuiz.value[0] || "";
    }

    if (preferencias.value &&
      (!generos.value.includes(preferencias.value.genero) ||
       !idiomasQuiz.value.includes(preferencias.value.idioma))) {
      preferencias.value = null;
      quizAbierto.value = true;
      errorQuiz.value = "Actualizamos el catálogo. Revisá tus gustos para ver recomendaciones.";
    }
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

const librosRecomendados = computed(() =>
  preferencias.value
    ? BibliotecaService.ordenarPorPreferencias(librosFiltrados.value, preferencias.value)
    : []
);
const coincidenciasCompletas = computed(() => {
  if (!preferencias.value) return 0;
  return librosRecomendados.value.filter((libro) =>
    BibliotecaService.puntuarPreferencias(libro, preferencias.value) === 3
  ).length;
});

function guardarPreferencias() {
  errorQuiz.value = "";
  if (!generoQuiz.value || !idiomaQuiz.value) {
    errorQuiz.value = "No hay suficientes datos del catálogo para completar el quiz.";
    return;
  }

  if (
    !Number.isInteger(anioDesdeQuiz.value) ||
    !Number.isInteger(anioHastaQuiz.value) ||
    anioDesdeQuiz.value < 0 ||
    anioHastaQuiz.value > ANIO_ACTUAL ||
    anioDesdeQuiz.value > anioHastaQuiz.value
  ) {
    errorQuiz.value = `Ingresá un rango válido entre 0 y ${ANIO_ACTUAL}.`;
    return;
  }

  const respuestas = {
    genero: generoQuiz.value,
    idioma: idiomaQuiz.value,
    anioDesde: anioDesdeQuiz.value,
    anioHasta: anioHastaQuiz.value
  };
  preferencias.value = respuestas;
  quizAbierto.value = false;

  try {
    localStorage.setItem(CLAVE_PREFERENCIAS_QUIZ, JSON.stringify(respuestas));
  } catch {
    errorQuiz.value = "Tus recomendaciones están listas, pero no se pudieron guardar para la próxima visita.";
  }
}

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
      <form v-if="quizAbierto" class="quiz-preferencias" @submit.prevent="guardarPreferencias">
        <div class="quiz-encabezado">
          <div>
            <p class="quiz-etiqueta">RECOMENDACIONES PERSONALIZADAS</p>
            <h3>Encontrá tu próxima lectura</h3>
            <p>Respondé estas tres preguntas y ordenamos primero los libros que más se parecen a tus gustos.</p>
          </div>
        </div>

        <div class="preguntas-quiz">
          <label class="campo">
            <span>1. ¿Qué género te gusta más?</span>
            <select v-model="generoQuiz" required>
              <option v-for="genero in generos.slice(1)" :key="genero" :value="genero">
                {{ genero }}
              </option>
            </select>
          </label>

          <label class="campo">
            <span>2. ¿En qué idioma preferís leer?</span>
            <select v-model="idiomaQuiz" required>
              <option v-for="idioma in idiomasQuiz" :key="idioma" :value="idioma">
                {{ idioma }}
              </option>
            </select>
          </label>

          <fieldset class="campo campo-anios-quiz">
            <legend>3. ¿De qué época te interesan los libros?</legend>
            <div class="rango-anios">
              <label>
                <span class="sr-only">Año desde</span>
                <input v-model.number="anioDesdeQuiz" type="number" min="0" :max="ANIO_ACTUAL" required />
              </label>
              <span aria-hidden="true">a</span>
              <label>
                <span class="sr-only">Año hasta</span>
                <input v-model.number="anioHastaQuiz" type="number" min="0" :max="ANIO_ACTUAL" required />
              </label>
            </div>
          </fieldset>
        </div>

        <p v-if="errorQuiz" class="error-quiz" role="alert">{{ errorQuiz }}</p>
        <button type="submit" class="btn-recomendar">Ver mis recomendaciones</button>
      </form>

      <div v-if="preferencias && !quizAbierto" class="resumen-quiz">
        <p>
          Recomendaciones para <strong>{{ preferencias.genero }}</strong>,
          en <strong>{{ preferencias.idioma }}</strong>, entre
          <strong>{{ preferencias.anioDesde }} y {{ preferencias.anioHasta }}</strong>.
        </p>
        <button type="button" class="btn-cambiar-quiz" @click="quizAbierto = true">
          Cambiar gustos
        </button>
      </div>

      <template v-if="preferencias">
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
          <strong>{{ librosRecomendados.length }}</strong> de {{ libros.length }} libros
          · {{ coincidenciasCompletas }} coincidencias con tus tres respuestas
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
          v-for="libro in librosRecomendados"
          :key="libro.id"
          :libro="libro"
        />
      </div>
      </template>
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

.quiz-preferencias {
  margin-bottom: 24px;
  padding: clamp(18px, 3vw, 28px);
  background:
    radial-gradient(circle at 100% 0, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent 40%),
    var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radio-grande);
  box-shadow: var(--sombra);
}

.quiz-encabezado h3 {
  margin: 0 0 6px;
  color: var(--color-text);
  font-size: 1.4rem;
}

.quiz-encabezado p {
  margin: 0;
}

.quiz-encabezado .quiz-etiqueta {
  margin-bottom: 6px;
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.preguntas-quiz {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 16px;
  margin: 22px 0;
}

.campo-anios-quiz {
  margin: 0;
  padding: 0;
  border: 0;
}

.campo-anios-quiz legend {
  margin-bottom: 6px;
  padding: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.campo-anios-quiz .rango-anios label {
  flex: 1;
}

.campo-anios-quiz input {
  width: 100%;
}

.btn-recomendar {
  background-color: var(--color-accent);
  color: var(--color-bg-deep);
}

.btn-recomendar:hover {
  background-color: var(--color-accent-light);
}

.error-quiz {
  margin: 0 0 12px;
  color: var(--color-danger-soft);
}

.resumen-quiz {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 18px;
  padding: 12px 16px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radio);
}

.resumen-quiz p {
  margin: 0;
}

.btn-cambiar-quiz {
  min-height: 36px;
  padding: 5px 10px;
  background: none;
  border: 1px solid var(--color-border-light);
  color: var(--color-accent);
}

.btn-cambiar-quiz:hover {
  background-color: var(--color-surface-alt);
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
