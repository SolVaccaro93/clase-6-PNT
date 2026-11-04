// ==========================================
// PARTE DE MARISOL: BibliotecaService
// ==========================================

import { ref } from "vue";
import { useAuthStore } from "../stores/authStore.js";
import { autorArgentinoDe, consultaAutoresArgentinos } from "./autoresArgentinos.js";

export const ORIGEN_ARGENTINA = "Argentina";
export const ORIGEN_OTROS = "Otros países";
const MAX_LIBROS_ARGENTINOS = 15;
const MAX_LIBROS_POR_AUTOR_ARGENTINO = 2;
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

// Autores curados: el catálogo se arma con sus obras más editadas en OpenLibrary,
// así no entran libros cualquiera que devuelva una búsqueda genérica.
export const AUTORES_CATALOGO = [
  { nombre: "Jorge Luis Borges", pais: "Argentina" },
  { nombre: "Julio Cortázar", pais: "Argentina" },
  { nombre: "Ernesto Sabato", pais: "Argentina" },
  { nombre: "Adolfo Bioy Casares", pais: "Argentina" },
  { nombre: "Manuel Puig", pais: "Argentina" },
  { nombre: "Roberto Arlt", pais: "Argentina" },
  { nombre: "Silvina Ocampo", pais: "Argentina" },
  { nombre: "Alejandra Pizarnik", pais: "Argentina" },
  { nombre: "Ricardo Piglia", pais: "Argentina" },
  { nombre: "Samanta Schweblin", pais: "Argentina" },
  { nombre: "Mariana Enriquez", pais: "Argentina" },
  { nombre: "Gabriel García Márquez", pais: "Colombia" },
  { nombre: "Mario Vargas Llosa", pais: "Perú" },
  { nombre: "Isabel Allende", pais: "Chile" },
  { nombre: "Roberto Bolaño", pais: "Chile" },
  { nombre: "Juan Rulfo", pais: "México" },
  { nombre: "Carlos Fuentes", pais: "México" },
  { nombre: "Octavio Paz", pais: "México" },
  { nombre: "Mario Benedetti", pais: "Uruguay" },
  { nombre: "Eduardo Galeano", pais: "Uruguay" },
  { nombre: "Horacio Quiroga", pais: "Uruguay" },
  { nombre: "Alejo Carpentier", pais: "Cuba" }
];
const OBRAS_POR_AUTOR = 3;

// Compara nombres sin tildes ni mayúsculas ("Sábato" = "Sabato")
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Lista de libros que se llenará con el fetch a OpenLibrary
let libros = [];
let catalogoCargado = false;
let cargaPendiente = null;

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

// Trae libros de autores argentinos, con un máximo por autor para que haya variedad.
// Es un agregado: si la consulta falla, el catálogo se carga igual con los libros generales.
async function buscarDocsArgentinos(campos) {
  try {
    const consulta = encodeURIComponent(consultaAutoresArgentinos());
    const respuesta = await fetch(`https://openlibrary.org/search.json?q=${consulta}&limit=100&fields=${campos}`,
      { signal: AbortSignal.timeout(TIEMPO_MAXIMO_CONSULTA_MS) });
    if (!respuesta.ok) return [];

    const data = await respuesta.json();
    const librosPorAutor = new Map();
    return (data.docs || [])
      .filter((doc) => {
        const autor = autorArgentinoDe(doc.author_name);
        if (!autor) return false;
        const cantidad = librosPorAutor.get(autor) || 0;
        librosPorAutor.set(autor, cantidad + 1);
        return cantidad < MAX_LIBROS_POR_AUTOR_ARGENTINO;
      })
      .slice(0, MAX_LIBROS_ARGENTINOS);
  } catch {
    return [];
  }
}

export const BibliotecaService = {
  /**
   * Carga libros de autores argentinos y latinoamericanos desde la API pública de OpenLibrary
   * @param {number} limite Cantidad máxima de libros a traer
   */
  async cargarLibros(limite = AUTORES_CATALOGO.length * OBRAS_POR_AUTOR) {
    if (catalogoCargado) return libros;
    if (cargaPendiente) return cargaPendiente;

    cargaPendiente = this.cargarDesdeApi(limite);
    try {
      return await cargaPendiente;
    } finally {
      cargaPendiente = null;
    }
  },

  async cargarDesdeApi(limite) {
    const campos = [
      "key",
      "title",
      "author_name",
      "subject",
      "first_publish_year",
      "number_of_pages_median",
      "ratings_average",
      "ratings_count",
      "language",
      "publisher",
      "edition_count",
      "cover_i",
      "cover_edition_key"
    ].join(",");
    // Una búsqueda por autor, en paralelo. Se ordena por cantidad de ediciones para
    // quedarse con las obras conocidas y no con antologías o estudios sobre el autor.
    const [resultados, docsArgentinos] = await Promise.all([Promise.allSettled(
      AUTORES_CATALOGO.map(async (autor) => {
        const URL = `https://openlibrary.org/search.json?author=${encodeURIComponent(autor.nombre)}` +
          `&language=spa&sort=editions&limit=10&fields=${campos}`;
        const respuesta = await fetch(URL, { signal: AbortSignal.timeout(TIEMPO_MAXIMO_CONSULTA_MS) });
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        const data = await respuesta.json();
        return (data.docs || [])
          // Solo obras donde el autor buscado es el autor principal y que tengan portada
          .filter((doc) => doc.author_name?.[0] && normalizar(doc.author_name[0]) === normalizar(autor.nombre))
          .filter((doc) => doc.cover_i || doc.cover_edition_key)
          .slice(0, OBRAS_POR_AUTOR)
          .map((doc) => ({ ...doc, pais: autor.pais }));
      })
    ), buscarDocsArgentinos(campos)]);

    if (resultados.every((r) => r.status === "rejected")) {
      throw new Error("No se pudieron obtener los libros.");
    }

    // Sin repetidos (misma obra o mismo título). Los argentinos extra van al final.
    const vistos = new Set();
    const docs = [
      ...resultados.flatMap((r) => (r.status === "fulfilled" ? r.value : [])),
      ...docsArgentinos.map((doc) => ({ ...doc, pais: ORIGEN_ARGENTINA }))
    ].filter((doc) => {
      const titulo = normalizar(doc.title);
      if (vistos.has(doc.key) || vistos.has(titulo)) return false;
      vistos.add(doc.key);
      vistos.add(titulo);
      return true;
    });

    const generosEjemplo = ["Novela", "Ficción", "Clásico", "Drama", "Aventura"];
    const mapaIdiomas = {
      spa: "Español",
      eng: "Inglés",
      fre: "Francés",
      ger: "Alemán",
      ita: "Italiano",
      por: "Portugués",
      cat: "Catalán",
      lat: "Latín",
      rus: "Ruso",
      chi: "Chino"
    };

    libros = docs.map((doc, index) => {
      let genero = "Novela";
      if (doc.subject && doc.subject.length > 0 && typeof doc.subject[0] === "string") {
        genero = doc.subject[0].split(",")[0].trim();
        if (genero.length > 18) {
          genero = genero.substring(0, 18);
        }
      } else {
        genero = generosEjemplo[index % generosEjemplo.length];
      }

      // Obtención de portadas desde la API de OpenLibrary Covers
      let portada = null;
      let portadaGrande = null;
      if (doc.cover_i) {
        portada = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
        portadaGrande = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      } else if (doc.cover_edition_key) {
        portada = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
        portadaGrande = `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`;
      }

      // Metadatos esenciales del libro
      const anioPublicacion = doc.first_publish_year || (doc.publish_year && doc.publish_year[0]) || "Clásico";
      const paginas = doc.number_of_pages_median || (doc.number_of_pages || (220 + ((index * 37) % 200)));

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

      // Idioma
      // OpenLibrary lista los idiomas de todas las ediciones; si hay edición en español se muestra esa
      const codIdioma = doc.language?.includes("spa") ? "spa" : doc.language?.[0] || null;
      const idioma = codIdioma ? (mapaIdiomas[codIdioma] || codIdioma.toUpperCase()) : "Español";

      // Editorial
      const editorial = doc.publisher && doc.publisher.length > 0 && doc.publisher[0].trim()
        ? doc.publisher[0].trim()
        : "Editorial Planeta";

      // Ediciones
      const ediciones = doc.edition_count || 1;

      return {
        id: index + 1,
        // Clave estable de OpenLibrary (ej: "/works/OL123W"), no depende del orden de la API
        clave: doc.key,
        titulo: doc.title,
        autor: doc.author_name ? doc.author_name[0] : "Autor desconocido",
        pais: doc.pais,
        genero: genero,
        portada,
        portadaGrande,
        paginas,
        anioPublicacion,
        puntaje,
        puntajeTexto,
        criticasTotal,
        editorial,
        idioma,
        ediciones,
        origen: autorArgentinoDe(doc.author_name) ? ORIGEN_ARGENTINA : ORIGEN_OTROS
      };
    });

    inicializarStockParaLibros(libros);
    catalogoCargado = true;

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
   * @param {{ editorial?: string, idioma?: string, origen?: string, anioDesde?: number | null, anioHasta?: number | null }} filtros
   *   Editorial, idioma y origen exactos ("" o "Todas"/"Todos" = sin filtro); años con ambos extremos incluidos.
   */
  buscar(texto = "", genero = "", estrellasMinimas = 0, rangoPaginas = null, filtros = {}) {
    const busquedaLimpia = texto.trim().toLowerCase();
    const generoLimpio = genero.trim().toLowerCase();
    const editorialLimpia = (filtros.editorial || "").trim().toLowerCase();
    const idiomaLimpio = (filtros.idioma || "").trim().toLowerCase();
    const origenLimpio = (filtros.origen || "").trim().toLowerCase();
    const anioDesde = Number.isFinite(filtros.anioDesde) ? filtros.anioDesde : null;
    const anioHasta = Number.isFinite(filtros.anioHasta) ? filtros.anioHasta : null;

    return libros.filter((libro) => {
      const coincideTexto =
        !busquedaLimpia ||
        libro.titulo.toLowerCase().includes(busquedaLimpia) ||
        libro.autor.toLowerCase().includes(busquedaLimpia);

      const coincideGenero =
        !generoLimpio ||
        generoLimpio === "todos" ||
        libro.genero.toLowerCase() === generoLimpio;

      const coincideEstrellas = (libro.puntaje ?? 0) >= Number(estrellasMinimas);

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

      const coincideOrigen =
        !origenLimpio ||
        origenLimpio === "todos" ||
        libro.origen.toLowerCase() === origenLimpio;

      // Los libros sin año numérico (ej: "Clásico") quedan afuera si se pide un rango de años
      const tieneAnio = typeof libro.anioPublicacion === "number";
      const coincideAnio =
        (anioDesde === null && anioHasta === null) ||
        (tieneAnio &&
          (anioDesde === null || libro.anioPublicacion >= anioDesde) &&
          (anioHasta === null || libro.anioPublicacion <= anioHasta));

      return coincideTexto && coincideGenero && coincideEstrellas && coincidePaginas &&
        coincideEditorial && coincideIdioma && coincideOrigen && coincideAnio;
    });
  },

  /**
   * Obtiene la lista de géneros disponibles sin repetidos.
   */
  getGeneros() {
    const generosSet = new Set(libros.map((libro) => libro.genero));
    return Array.from(generosSet);
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
