// ==========================================
// PARTE DE MARISOL: BibliotecaService
// ==========================================

import { ref } from "vue";
import { useAuthStore } from "../stores/authStore.js";
import { useVotosStore } from "../stores/votosStore.js";

const CLAVE_PREFERENCIAS_QUIZ = "biblioteca_preferencias_lectura";
const LIMITE_LIBROS = 40;
// Si OpenLibrary no responde, se corta la consulta para mostrar el error en vez de quedar cargando
const TIEMPO_MAXIMO_CONSULTA_MS = 10000;

const CLAVE_PRESTAMOS = "biblioteca_prestamos_stock";
function leerDatos() {
  const datos = JSON.parse(localStorage.getItem(CLAVE_PRESTAMOS) || "null");
  return datos || { prestamos: [], stock: {} };
}
let datos = leerDatos();
export const cambiosPrestamos = ref(0);

function guardar(prestamos, stock) {
  // Guardar primero: si falla la persistencia no se modifica el stock en memoria.
  const siguientes = { prestamos, stock };
  localStorage.setItem(CLAVE_PRESTAMOS, JSON.stringify(siguientes));
  datos = siguientes;
}

//función usuarioActual()
function usuarioActual() {
  // El store se pide ADENTRO de la función (no arriba del archivo): se
  // ejecuta al retirar/devolver, cuando Pinia ya está instalada.
  const authStore = useAuthStore();
  if (!authStore.usuario) throw new Error("Iniciá sesión para gestionar tus préstamos.");
  return authStore.usuario.usuario;
}

function fechaActual() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export const SUCURSALES = [
  { id: 1, nombre: "Centro" },
  { id: 2, nombre: "Floresta" },
  { id: 3, nombre: "Belgrano" }
];

// Contador reactivo: aumenta cada vez que cambia el stock, para que el mapa se actualice.
export const cambiosStock = ref(0);

// Géneros comunes del quiz. "subject" es el tema de OpenLibrary con el que se filtra la API.
export const GENEROS_QUIZ = [
  { nombre: "Novela", subject: "novel" },
  { nombre: "Ficción", subject: "fiction" },
  { nombre: "Fantasía", subject: "fantasy" },
  { nombre: "Ciencia ficción", subject: "science fiction" },
  { nombre: "Misterio", subject: "mystery" },
  { nombre: "Policial", subject: "detective and mystery stories" },
  { nombre: "Romance", subject: "romance" },
  { nombre: "Terror", subject: "horror" },
  { nombre: "Aventura", subject: "adventure" },
  { nombre: "Cuentos", subject: "short stories" },
  { nombre: "Poesía", subject: "poetry" },
  { nombre: "Historia", subject: "history" },
  { nombre: "Biografía", subject: "biography" },
  { nombre: "Filosofía", subject: "philosophy" },
  { nombre: "Infantil", subject: "children" }
];

// Idiomas del quiz. "codigo" es el que usa OpenLibrary.
export const IDIOMAS_QUIZ = [
  { nombre: "Español", codigo: "spa" },
  { nombre: "Inglés", codigo: "eng" },
  { nombre: "Francés", codigo: "fre" },
  { nombre: "Alemán", codigo: "ger" },
  { nombre: "Italiano", codigo: "ita" },
  { nombre: "Portugués", codigo: "por" }
];

// Sin gustos guardados (ej: se entra directo a un libro) se muestra un catálogo general.
const PREFERENCIAS_POR_DEFECTO = { genero: "Ficción", idioma: "Español", anioDesde: null, anioHasta: null };

// Compara nombres sin tildes ni mayúsculas ("Sábato" = "Sabato")
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function puntuarPreferencias(libro, preferencias) {
  const coincideGenero = normalizar(libro.genero) === normalizar(preferencias.genero);
  const coincideIdioma = normalizar(libro.idioma) === normalizar(preferencias.idioma);
  const anio = libro.anioPublicacion;
  const coincideAnio = typeof anio === "number" &&
    anio >= preferencias.anioDesde &&
    anio <= preferencias.anioHasta;

  return Number(coincideGenero) + Number(coincideIdioma) + Number(coincideAnio);
}

// Lista de libros que se llenará con el fetch a OpenLibrary
let libros = [];
let claveCatalogo = null;
let cargaPendiente = null;
let clavePendiente = null;

function leerPreferenciasGuardadas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS_QUIZ) || "null");
    const generoValido = GENEROS_QUIZ.some((g) => g.nombre === guardadas?.genero);
    const idiomaValido = IDIOMAS_QUIZ.some((i) => i.nombre === guardadas?.idioma);
    return generoValido && idiomaValido ? guardadas : null;
  } catch {
    return null;
  }
}

// Mapa de stock: Map<libroId, Map<sucursalId, cantidad>>
const stockMap = new Map();

// Asigna stock para cada libro en las 3 sucursales
function inicializarStockParaLibros(listaLibros) {
  stockMap.clear();

  listaLibros.forEach((libro, index) => {
    const stockPorSucursal = new Map();

    const stockCentro = index % 3 === 0 ? 0 : (index % 4) + 1;
    const stockFloresta = index % 2 === 0 ? 0 : ((index + 1) % 3) + 1;
    const stockBelgrano = index % 5 === 0 ? 0 : 2;

    stockPorSucursal.set(1, stockCentro);    // Centro
    stockPorSucursal.set(2, stockFloresta);  // Floresta
    stockPorSucursal.set(3, stockBelgrano);  // Belgrano

    SUCURSALES.forEach(({ id }) => {
      const guardado = datos.stock[libro.clave]?.[id];
      if (Number.isInteger(guardado) && guardado >= 0) stockPorSucursal.set(id, guardado);
    });

    stockMap.set(libro.id, stockPorSucursal);
  });
}

// Arma la consulta a OpenLibrary: el género, el idioma y la época se filtran en la API.
function armarUrlBusqueda(preferencias, campos) {
  const genero = GENEROS_QUIZ.find((g) => g.nombre === preferencias.genero) || GENEROS_QUIZ[1];
  const idioma = IDIOMAS_QUIZ.find((i) => i.nombre === preferencias.idioma) || IDIOMAS_QUIZ[0];
  const condiciones = [`subject:"${genero.subject}"`, `language:${idioma.codigo}`];
  const desde = Number.isInteger(preferencias.anioDesde) ? preferencias.anioDesde : "*";
  const hasta = Number.isInteger(preferencias.anioHasta) ? preferencias.anioHasta : "*";
  if (desde !== "*" || hasta !== "*") condiciones.push(`first_publish_year:[${desde} TO ${hasta}]`);

  return `https://openlibrary.org/search.json?q=${encodeURIComponent(condiciones.join(" AND "))}` +
    `&sort=editions&limit=${LIMITE_LIBROS * 2}&fields=${campos}`;
}

export const BibliotecaService = {
  /**
   * Carga desde OpenLibrary los libros que coinciden con los gustos del quiz.
   * Sin argumentos usa el catálogo ya cargado; si no hay, los gustos guardados o uno general.
   * @param {{ genero: string, idioma: string, anioDesde: number|null, anioHasta: number|null } | null} preferencias
   */
  async cargarLibros(preferencias = null) {
    if (!preferencias && claveCatalogo) return libros;
    const efectivas = preferencias || leerPreferenciasGuardadas() || PREFERENCIAS_POR_DEFECTO;
    const clave = JSON.stringify([efectivas.genero, efectivas.idioma, efectivas.anioDesde, efectivas.anioHasta]);

    if (clave === claveCatalogo) return libros;
    if (cargaPendiente && clave === clavePendiente) return cargaPendiente;

    const pendiente = this.cargarDesdeApi(efectivas, clave);
    cargaPendiente = pendiente;
    clavePendiente = clave;
    try {
      return await pendiente;
    } finally {
      if (cargaPendiente === pendiente) {
        cargaPendiente = null;
        clavePendiente = null;
      }
    }
  },

  async cargarDesdeApi(preferencias, clave) {
    const campos = [
      "key",
      "title",
      "author_name",
      "first_publish_year",
      "number_of_pages_median",
      "ratings_average",
      "ratings_count",
      "publisher",
      "edition_count",
      "cover_i",
      "cover_edition_key",
      // La edición que cumple el filtro de idioma: de ahí salen el título, la portada y la editorial
      "editions",
      "editions.key",
      "editions.title",
      "editions.language",
      "editions.publisher",
      "editions.cover_i"
    ].join(",");

    const respuesta = await fetch(armarUrlBusqueda(preferencias, campos),
      { signal: AbortSignal.timeout(TIEMPO_MAXIMO_CONSULTA_MS) });
    if (!respuesta.ok) throw new Error("No se pudieron obtener los libros.");
    const data = await respuesta.json();

    const tienePortada = (doc) => Number(Boolean(doc.editions?.docs?.[0]?.cover_i || doc.cover_i || doc.cover_edition_key));
    // Sin repetidos (misma obra o mismo título) y con las portadas primero
    const vistos = new Set();
    const docs = (data.docs || [])
      .filter((doc) => {
        if (!doc.key || !doc.title) return false;
        const titulo = normalizar(doc.title);
        if (vistos.has(doc.key) || vistos.has(titulo)) return false;
        vistos.add(doc.key);
        vistos.add(titulo);
        return true;
      })
      .sort((a, b) => tienePortada(b) - tienePortada(a))
      .slice(0, LIMITE_LIBROS);

    libros = docs.map((doc, index) => {
      const edicion = doc.editions?.docs?.[0] || {};
      const coverId = edicion.cover_i || doc.cover_i;
      // Obtención de portadas desde la API de OpenLibrary Covers
      let portada = null;
      let portadaGrande = null;
      if (coverId) {
        portada = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
        portadaGrande = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      } else if (doc.cover_edition_key) {
        portada = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
        portadaGrande = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
      }

      // Metadatos esenciales del libro
      const anioPublicacion = doc.first_publish_year || "Clásico";
      const paginas = doc.number_of_pages_median || (220 + ((index * 37) % 200));

      // Puntaje según la crítica y lectores
      let puntaje = null;
      let puntajeTexto = "Sin calificar";
      let criticasTotal = doc.ratings_count || 0;
      if (doc.ratings_average) {
        puntaje = Number(doc.ratings_average.toFixed(1));
        puntajeTexto = `${puntaje} / 5`;
      } else {
        const puntajeEstimado = Number((3.8 + ((index % 12) * 0.1)).toFixed(1));
        puntaje = puntajeEstimado;
        puntajeTexto = `${puntajeEstimado} / 5`;
        criticasTotal = (index % 7) + 3;
      }

      const editoriales = edicion.publisher || doc.publisher || [];
      const editorial = editoriales[0]?.trim() || "Editorial Planeta";

      return {
        id: index + 1,
        // Clave estable de OpenLibrary (ej: "/works/OL123W"), no depende del orden de la API
        clave: doc.key,
        // Título de la edición en el idioma elegido (la obra original puede estar en otro)
        titulo: edicion.title || doc.title,
        autor: doc.author_name ? doc.author_name[0] : "Autor desconocido",
        // La API ya filtró por género e idioma: se muestran los que eligió el lector
        genero: preferencias.genero,
        portada,
        portadaGrande,
        paginas,
        anioPublicacion,
        puntaje,
        puntajeTexto,
        criticasTotal,
        editorial,
        idioma: preferencias.idioma,
        ediciones: doc.edition_count || 1
      };
    });

    inicializarStockParaLibros(libros);
    claveCatalogo = clave;

    return libros;
  },

  getLibroPorId(id) {
    if (!/^[1-9]\d*$/.test(String(id))) return null;
    return libros.find((libro) => libro.id === Number(id)) || null;
  },

  /**
   * Busca libros por título o autor, y opcionalmente por género
   * por cantidad mínima de estrellas (puntaje de 0 a 5) y por rango de páginas.
   * @param {{ min: number, max: number } | null} rangoPaginas Ambos extremos incluidos; null = sin filtro
   * @param {{ editorial?: string, idioma?: string, anioDesde?: number | null, anioHasta?: number | null }} filtros
   *   Editorial e idioma exactos ("" o "Todas"/"Todos" = sin filtro); años con ambos extremos incluidos.
   */
  buscar(texto = "", genero = "", estrellasMinimas = 0, rangoPaginas = null, filtros = {}) {
    const busquedaLimpia = texto.trim().toLowerCase();
    const generoLimpio = genero.trim().toLowerCase();
    const editorialLimpia = (filtros.editorial || "").trim().toLowerCase();
    const idiomaLimpio = (filtros.idioma || "").trim().toLowerCase();
    const anioDesde = Number.isFinite(filtros.anioDesde) ? filtros.anioDesde : null;
    const anioHasta = Number.isFinite(filtros.anioHasta) ? filtros.anioHasta : null;

    // Las estrellas se comparan contra el puntaje VIGENTE (API + votos de usuarios).
    // El store solo se pide si de verdad se filtra por estrellas, para que las demás
    // búsquedas (y sus tests) no dependan de Pinia.
    const votos = Number(estrellasMinimas) > 0 ? useVotosStore() : null;

    return libros.filter((libro) => {
      const coincideTexto =
        !busquedaLimpia ||
        libro.titulo.toLowerCase().includes(busquedaLimpia) ||
        libro.autor.toLowerCase().includes(busquedaLimpia);

      const coincideGenero =
        !generoLimpio ||
        generoLimpio === "todos" ||
        libro.genero.toLowerCase() === generoLimpio;

     
      const coincideEstrellas = !votos || votos.puntajeVigente(libro) >= Number(estrellasMinimas);

      const coincidePaginas =
        !rangoPaginas ||
        (libro.paginas >= rangoPaginas.min && libro.paginas <= rangoPaginas.max);

      const coincideEditorial =
        !editorialLimpia ||
        editorialLimpia === "todas" ||
        libro.editorial.toLowerCase() === editorialLimpia;

      const coincideIdioma =
        !idiomaLimpio ||
        idiomaLimpio === "todos" ||
        libro.idioma.toLowerCase() === idiomaLimpio;

      // Los libros sin año numérico (ej: "Clásico") quedan afuera si se pide un rango de años
      const tieneAnio = typeof libro.anioPublicacion === "number";
      const coincideAnio =
        (anioDesde === null && anioHasta === null) ||
        (tieneAnio &&
          (anioDesde === null || libro.anioPublicacion >= anioDesde) &&
          (anioHasta === null || libro.anioPublicacion <= anioHasta));

      return coincideTexto && coincideGenero && coincideEstrellas && coincidePaginas &&
        coincideEditorial && coincideIdioma && coincideAnio;
    });
  },

  /**
   * Ordena los libros por la cantidad de preferencias que cumplen.
   * Los empates conservan el orden original del catálogo.
   */
  ordenarPorPreferencias(listaLibros, preferencias) {
    return listaLibros
      .map((libro, indice) => {
        return {
          libro,
          indice,
          puntaje: puntuarPreferencias(libro, preferencias)
        };
      })
      .sort((a, b) => b.puntaje - a.puntaje || a.indice - b.indice)
      .map(({ libro }) => libro);
  },

  puntuarPreferencias(libro, preferencias) {
    return puntuarPreferencias(libro, preferencias);
  },

  /**
   * Obtiene las editoriales disponibles sin repetidos, ordenadas alfabéticamente.
   */
  getEditoriales() {
    return Array.from(new Set(libros.map((libro) => libro.editorial))).sort((a, b) => a.localeCompare(b, "es"));
  },

  /**
   * Obtiene los idiomas disponibles sin repetidos, ordenados alfabéticamente.
   */
  getIdiomas() {
    return Array.from(new Set(libros.map((libro) => libro.idioma))).sort((a, b) => a.localeCompare(b, "es"));
  },

  /**
   * Consulta el stock disponible de un libro en todas las sucursales.
   */
  consultarDisponibilidad(libroId) {
    const mapaSucursales = stockMap.get(Number(libroId));

    if (!mapaSucursales) {
      throw new Error(`El libro con ID ${libroId} no existe.`);
    }

    return SUCURSALES.map((sucursal) => ({
      sucursal: { ...sucursal },
      cantidad: mapaSucursales.get(sucursal.id) || 0
    }));
  },

  /**
   * Solicita un libro en una sucursal específica.
   */
  solicitar(libroId, sucursalId) {
    return this.retirar(libroId, sucursalId);
  },
//el valor por defecto se evalúa cada vez que se llama a la
// función, así que sigue siendo reactivo dentro de un computed
obtenerPrestamos(idUsuario = useAuthStore().usuario?.usuario) {
    cambiosPrestamos.value;
    return datos.prestamos.filter((p) => p.id_usuario === idUsuario).map((p) => ({ ...p }));
  },

  // Préstamos de todos los usuarios (para las métricas del dueño). Son copias.
  obtenerTodosLosPrestamos() {
    cambiosPrestamos.value;
    return datos.prestamos.map((p) => ({ ...p }));
  },

  obtenerPrestamosActivos() {
    return this.obtenerPrestamos().filter((p) => p.fecha_devolucion === null);
  },

  obtenerPrestamoActivoDeLibro(claveLibro) {
    return this.obtenerPrestamosActivos().find((p) => p.clave_libro === claveLibro) || null;
  },

  retirar(libroId, sucursalId) {
    const idUsuario = usuarioActual();
    const idLibroNum = Number(libroId);
    const idSucursalNum = Number(sucursalId);
    const libro = this.getLibroPorId(idLibroNum);
    const sucursal = SUCURSALES.find((s) => s.id === idSucursalNum);
    if (!libro || !sucursal) throw new Error("El libro o la sucursal no existen.");
    if (this.obtenerPrestamoActivoDeLibro(libro.clave)) {
      throw new Error("Ya tenés este libro prestado. Devolvelo antes de retirarlo de nuevo.");
    }

    const stockLibro = stockMap.get(idLibroNum);
    const stockActual = stockLibro ? stockLibro.get(idSucursalNum) || 0 : 0;

    if (stockActual <= 0) {
      throw new Error("No hay stock disponible en la sucursal seleccionada.");
    }

    const prestamo = {
      id_prestamo: crypto.randomUUID(), id_usuario: idUsuario,
      clave_libro: libro.clave, titulo: libro.titulo, autor: libro.autor,
      id_sucursal: sucursal.id, sucursal: sucursal.nombre,
      fecha_retiro: fechaActual(), fecha_devolucion: null, estado_lectura: "leyendo"
    };
    guardar([...datos.prestamos, prestamo], {
      ...datos.stock,
      [libro.clave]: { ...datos.stock[libro.clave], [idSucursalNum]: stockActual - 1 }
    });
    stockLibro.set(idSucursalNum, stockActual - 1);
    cambiosStock.value++;
    cambiosPrestamos.value++;

    return { ...prestamo };
  },

  devolver(idPrestamo) {
    const idUsuario = usuarioActual();
    const prestamo = datos.prestamos.find((p) => p.id_prestamo === idPrestamo && p.id_usuario === idUsuario);
    if (!prestamo) throw new Error("No se encontró un préstamo tuyo con ese identificador.");
    if (prestamo.fecha_devolucion !== null) throw new Error("Este libro ya fue devuelto.");
    const libro = libros.find((l) => l.clave === prestamo.clave_libro);
    const stockLibro = libro ? stockMap.get(libro.id) : null;
    const actual = stockLibro?.get(prestamo.id_sucursal) ?? datos.stock[prestamo.clave_libro]?.[prestamo.id_sucursal];
    if (!Number.isInteger(actual)) throw new Error("No se pudo consultar el stock del préstamo.");
    const terminado = { ...prestamo, fecha_devolucion: fechaActual(), estado_lectura: "terminado" };
    guardar(datos.prestamos.map((p) => p.id_prestamo === idPrestamo ? terminado : p), {
      ...datos.stock,
      [prestamo.clave_libro]: { ...datos.stock[prestamo.clave_libro], [prestamo.id_sucursal]: actual + 1 }
    });
    stockLibro?.set(prestamo.id_sucursal, actual + 1);
    cambiosStock.value++;
    cambiosPrestamos.value++;

    return { ...terminado };
  },

  /**
   * Libros con al menos un ejemplar disponible en una sucursal (para el mapa).
   */
  getLibrosDisponiblesEnSucursal(sucursalId) {
    return libros
      .map((libro) => ({
        libro,
        cantidad: stockMap.get(libro.id)?.get(Number(sucursalId)) || 0
      }))
      .filter((item) => item.cantidad > 0);
  },

  // ==========================================
  // Requerimiento: Gestión de stock para Panel Admin - Matías
  // ==========================================
  obtenerTodoElStock() {
    return libros.map((libro) => {
      const mapa = stockMap.get(libro.id) || new Map();
      return {
        libro: libro,
        stockPorSucursal: SUCURSALES.map((s) => ({
          sucursal: s,
          cantidad: mapa.get(s.id) || 0
        }))
      };
    });
  },

  actualizarStock(libroId, sucursalId, cambio) {
    const stockLibro = stockMap.get(Number(libroId));
    if (!stockLibro) return;
    const actual = stockLibro.get(Number(sucursalId)) || 0;
    const nuevo = Math.max(0, actual + cambio);
    const libro = this.getLibroPorId(libroId);
    if (!SUCURSALES.some((s) => s.id === Number(sucursalId)) || !Number.isInteger(nuevo)) {
      throw new Error("El stock debe ser entero y la sucursal debe existir.");
    }
    guardar(datos.prestamos, {
      ...datos.stock,
      [libro.clave]: { ...datos.stock[libro.clave], [Number(sucursalId)]: nuevo }
    });
    stockLibro.set(Number(sucursalId), nuevo);
    cambiosStock.value++;
    return nuevo;
  }
};
