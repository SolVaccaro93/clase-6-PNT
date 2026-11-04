// =========================================================================
// Tarea 14: Más libros argentinos y filtro por origen - Sol
// =========================================================================
// OpenLibrary no informa el país de origen de un libro y sus temas no son
// confiables ("argentine fiction" incluye novelas románticas ambientadas allá).
// Por eso el origen se decide por autor: para sumar uno, alcanza con agregarlo acá.
export const AUTORES_ARGENTINOS = [
  "Jorge Luis Borges",
  "Julio Cortázar",
  "Ernesto Sabato",
  "Adolfo Bioy Casares",
  "Silvina Ocampo",
  "Manuel Puig",
  "Ricardo Piglia",
  "Mariana Enríquez",
  "Samanta Schweblin",
  "Claudia Piñeiro",
  "Eduardo Sacheri",
  "Osvaldo Soriano",
  "Roberto Arlt",
  "Tomás Eloy Martínez",
  "Rodolfo Walsh",
  "Guillermo Martínez",
  "Selva Almada",
  "Antonio Di Benedetto",
  "César Aira",
  "Leopoldo Marechal",
  "Florencia Bonelli",
  "Ricardo Güiraldes",
  "José Hernández",
  "Hebe Uhart",
  "Alejandra Pizarnik"
];

// Sin mayúsculas ni tildes: OpenLibrary a veces escribe "Ernesto Sábato" y a veces "Sabato".
function normalizar(nombre) {
  return nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const AUTORES_NORMALIZADOS = new Set(AUTORES_ARGENTINOS.map(normalizar));

// Primer autor argentino de la lista de autores de un libro, o null si no hay ninguno
export function autorArgentinoDe(autores = []) {
  return autores.find((autor) => AUTORES_NORMALIZADOS.has(normalizar(autor))) || null;
}

// Consulta de OpenLibrary que trae libros de cualquiera de estos autores
export function consultaAutoresArgentinos() {
  return `author:(${AUTORES_ARGENTINOS.map((autor) => `"${autor}"`).join(" OR ")})`;
}
