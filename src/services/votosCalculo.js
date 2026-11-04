// =========================================================================
// Requerimiento: Calificar libros con estrellas (promedio API + usuarios)
// Lógica PURA del promedio: no usa Vue, Pinia ni localStorage.
// Por eso se puede probar sola, con tests chicos y rápidos.
// =========================================================================

// El puntaje que trae OpenLibrary cuenta como esta cantidad de votos "fijos".
// Con 3, un solo voto de un usuario ya se nota en la demo (por ejemplo,
// un 5 sobre un 3,8 lo sube a 4,1). Si se sube este número, los votos de
// usuarios pesan menos; si se baja, pesan más.
export const PESO_PUNTAJE_API = 3;

export const PUNTAJE_MINIMO = 0.5;
export const PUNTAJE_MAXIMO = 5;

// Un voto es válido si va de 0,5 a 5 y es múltiplo de 0,5 (media estrella).
// Number.isInteger(p * 2) es true para 0.5, 1, 1.5... y false para 3.3.
export function esPuntajeValido(puntaje) {
  return (
    typeof puntaje === "number" &&
    Number.isFinite(puntaje) &&
    puntaje >= PUNTAJE_MINIMO &&
    puntaje <= PUNTAJE_MAXIMO &&
    Number.isInteger(puntaje * 2)
  );
}

/**
 * Promedio ponderado entre el puntaje de la API y los votos de los usuarios.
 *
 *   promedio = (puntajeApi * PESO + suma de votos) / (PESO + cantidad de votos)
 *
 * Se redondea a 1 decimal (mitad hacia arriba), igual que se muestra en pantalla.
 * Así lo que el usuario VE es lo que usa el filtro de estrellas.
 *
 * @param {number|null} puntajeApi Puntaje original del libro (0 a 5)
 * @param {number[]} votos Votos de los usuarios de la app (0,5 a 5)
 * @returns {{ promedio: number, cantidad: number }} cantidad = votos de usuarios
 */
export function calcularPromedio(puntajeApi, votos = []) {
  const validos = votos.filter(esPuntajeValido);

  // Si el libro no tiene puntaje de la API, su "peso" es 0 y el promedio
  // sale solo de los votos de usuarios.
  const hayApi = Number.isFinite(puntajeApi);
  const peso = hayApi ? PESO_PUNTAJE_API : 0;

  const totalPeso = peso + validos.length;
  if (totalPeso === 0) return { promedio: 0, cantidad: 0 };

  // Se trabaja en DÉCIMAS (enteros): 3,8 -> 38 y 4,5 -> 45. Con enteros no hay
  // errores de coma flotante, y el redondeo de casos como 3,975 sale bien (4,0).
  const decimasApi = hayApi ? Math.round(puntajeApi * 10) : 0;
  const sumaDecimas =
    decimasApi * peso + validos.reduce((suma, voto) => suma + Math.round(voto * 10), 0);

  return {
    promedio: Math.round(sumaDecimas / totalPeso) / 10,
    cantidad: validos.length
  };
}

// 3.8 -> "3,8" (formato argentino, siempre con un decimal)
export function formatearPuntaje(numero) {
  return Number(numero).toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}