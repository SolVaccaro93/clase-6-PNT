// ==========================================
// PARTE DE MARISOL: BibliotecaService
// ==========================================

import { ref } from "vue";

export const SUCURSALES = [
  { id: 1, nombre: "Centro" },
  { id: 2, nombre: "Floresta" },
  { id: 3, nombre: "Belgrano" }
];

// Contador reactivo: aumenta cada vez que cambia el stock, para que el mapa se actualice.
export const cambiosStock = ref(0);

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

    stockMap.set(libro.id, stockPorSucursal);
  });
}

export const BibliotecaService = {
  /**
   * Carga libros desde la API pública de OpenLibrary usando fetch
   * @param {number} limite Cantidad de libros a traer (por defecto 25)
   */
  async cargarLibros(limite = 25) {
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
    const URL = `https://openlibrary.org/search.json?q=novela&limit=${limite}`;
    const respuesta = await fetch(URL);

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: No se pudieron obtener los libros.`);
    }

    const data = await respuesta.json();
    const docs = data.docs || [];

    const generosEjemplo = ["Novela", "Ficción", "Clásico", "Drama", "Aventura"];

    libros = docs.slice(0, limite).map((doc, index) => {
      let genero = "Novela";
      if (doc.subject && doc.subject.length > 0 && typeof doc.subject[0] === "string") {
        genero = doc.subject[0].split(",")[0].trim();
        if (genero.length > 18) {
          genero = genero.substring(0, 18);
        }
      } else {
        genero = generosEjemplo[index % generosEjemplo.length];
      }

      return {
        id: index + 1,
        // Clave estable de OpenLibrary (ej: "/works/OL123W"), no depende del orden de la API
        clave: doc.key,
        titulo: doc.title,
        autor: doc.author_name ? doc.author_name[0] : "Autor desconocido",
        genero: genero
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
   * Busca libros por título o autor, y opcionalmente por género.
   */
  buscar(texto = "", genero = "") {
    const busquedaLimpia = texto.trim().toLowerCase();
    const generoLimpio = genero.trim().toLowerCase();

    return libros.filter((libro) => {
      const coincideTexto =
        !busquedaLimpia ||
        libro.titulo.toLowerCase().includes(busquedaLimpia) ||
        libro.autor.toLowerCase().includes(busquedaLimpia);

      const coincideGenero =
        !generoLimpio ||
        generoLimpio === "todos" ||
        libro.genero.toLowerCase() === generoLimpio;

      return coincideTexto && coincideGenero;
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
    const idLibroNum = Number(libroId);
    const idSucursalNum = Number(sucursalId);

    const stockLibro = stockMap.get(idLibroNum);
    const stockActual = stockLibro ? stockLibro.get(idSucursalNum) || 0 : 0;

    if (stockActual <= 0) {
      throw new Error("SIN_STOCK");
    }

    // Descuenta stock en el Map
    stockLibro.set(idSucursalNum, stockActual - 1);
    cambiosStock.value++;

    return {
      ok: true,
      mensaje: "Solicitud realizada con éxito."
    };
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
    stockLibro.set(Number(sucursalId), nuevo);
    return nuevo;
  }
};
