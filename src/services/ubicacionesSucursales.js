// =========================================================================
// Ubicaciones de sucursales para el mapa - Sol
// =========================================================================
// DATOS DE EJEMPLO (CABA): reemplazar por la dirección, latitud y longitud
// que cargue Pato en la tabla Sucursal. Se asocian por id de sucursal.
import { SUCURSALES } from "./bibliotecaService.js";

export const UBICACIONES_SUCURSALES = {
  1: { direccion: "Av. Corrientes 1250, CABA", latitud: -34.6037, longitud: -58.3842 },
  2: { direccion: "Av. Rivadavia 8050, CABA", latitud: -34.6283, longitud: -58.4835 },
  3: { direccion: "Av. Cabildo 2040, CABA", latitud: -34.5605, longitud: -58.4565 }
};

// Sucursales del catálogo con su ubicación (las que no tienen coordenadas no van al mapa)
export function getSucursalesConUbicacion() {
  return SUCURSALES
    .filter((s) => UBICACIONES_SUCURSALES[s.id])
    .map((s) => ({ ...s, ...UBICACIONES_SUCURSALES[s.id] }));
}
