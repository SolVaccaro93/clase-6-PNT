// ==========================================
// PARTE DE MARISOL: BibliotecaService
// ==========================================

export const SUCURSALES = [
  { id: 1, nombre: "Centro" },
  { id: 2, nombre: "Floresta" },
  { id: 3, nombre: "Belgrano" }
];

// Lista de libros que se llenará con el fetch a OpenLibrary
let libros = [];

// Mapa de stock: Map<libroId, Map<sucursalId, cantidad>>
const stockMap = new Map();

// Asigna stock para cada libro en las 3 sucursales
function inicializarStockParaLibros(listaLibros) {
  stockMap.clear();

  listaLibros.forEach((libro, index) => {
    const stockPorSucursal = new Map();

    // Generamos stock variado para probar todos los casos:
    // - En algunos libros Floresta tendrá 0 para probar el mensaje amigable
    // - En otros habrá stock en todas
    // - En otros estará agotado
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
    const URL = `https://openlibrary.org/search.json?q=novela&limit=${limite}`;
    const respuesta = await fetch(URL);

    if (!respuesta.ok) {
      throw new Error(`Error ${respuesta.status}: No se pudieron obtener los libros.`);
    }

    const data = await respuesta.json();
    const docs = data.docs || [];

    const generosEjemplo = ["Novela", "Ficción", "Clásico", "Drama", "Aventura"];

    libros = docs.slice(0, limite).map((doc, index) => {
      // Determinamos un género limpio (si la API lo trae lo usamos, si no asignamos uno)
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
        titulo: doc.title,
        autor: doc.author_name ? doc.author_name[0] : "Autor desconocido",
        genero: genero
      };
    });

    // Creamos el mapa de stock para estos 25 libros
    inicializarStockParaLibros(libros);

    return libros;
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

    return {
      ok: true,
      mensaje: "Solicitud realizada con éxito."
    };
  }
};
