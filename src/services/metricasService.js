// =========================================================================
// Métricas del negocio para el dueño de la librería - Sol
// =========================================================================
// Funciones puras: reciben los datos y devuelven las métricas, sin leer
// localStorage ni la API. Así se pueden probar y usar con datos de demostración.
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { calcularVencimiento } from "./devolucionService.js";

export const PERIODOS = [
  { dias: 7, texto: "7 días" },
  { dias: 30, texto: "30 días" },
  { dias: 90, texto: "90 días" }
];

const TOP = 5;

// Nombres para mostrar (usuarios de prueba y amigos de demostración)
const NOMBRES = {
  lector: "Sol Vaccaro",
  admin: "Matías Gratz",
  duenolibreria: "Dueño de la librería",
  pato: "Patricio",
  valen: "Valentín",
  lucia: "Lucía Fernández",
  marcos: "Marcos Díaz",
  sofi: "Sofía Romero",
  nico: "Nicolás Paz"
};

export function nombreDeUsuario(usuario) {
  return NOMBRES[usuario] || usuario;
}

// Cuenta elementos por clave y devuelve los más frecuentes: [{ clave, cantidad, ...extra }]
function ranking(lista, claveDe, extraDe = () => ({}), limite = TOP) {
  const conteo = new Map();
  lista.forEach((item) => {
    const clave = claveDe(item);
    const actual = conteo.get(clave) || { clave, cantidad: 0, ...extraDe(item) };
    actual.cantidad++;
    conteo.set(clave, actual);
  });
  return [...conteo.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, limite);
}

function promedio(numeros) {
  return numeros.length ? numeros.reduce((a, b) => a + b, 0) / numeros.length : null;
}

/**
 * @param {object} datos
 * @param {Array} datos.prestamos   Préstamos de todos los usuarios
 * @param {object} datos.votos      { [claveLibro]: { [usuario]: puntaje } }
 * @param {Array} datos.libros      Catálogo (para títulos y stock)
 * @param {Function} datos.stockTotalDe  libro => ejemplares en todas las sucursales
 * @param {Array} datos.eventos     Interacciones registradas (búsquedas)
 * @param {object} datos.titulos    { [claveLibro]: titulo } de los libros votados que no están en el catálogo
 * @param {Array} datos.sucursales  [{ id, nombre }]
 * @param {number} datos.dias       Tamaño del período, contando hoy
 * @param {Date} datos.hoy
 */
export function calcularMetricas({
  prestamos = [],
  votos = {},
  libros = [],
  stockTotalDe = () => 0,
  eventos = [],
  titulos = {},
  sucursales = [],
  dias = 30,
  hoy = new Date()
}) {
  // Una fecha está en el período si fue hoy o en los (dias - 1) días anteriores
  const enPeriodo = (fechaIso) => {
    if (!fechaIso) return false;
    const atras = differenceInCalendarDays(hoy, parseISO(fechaIso));
    return atras >= 0 && atras < dias;
  };

  // ---- Préstamos ----
  const retirosDelPeriodo = prestamos.filter((p) => enPeriodo(p.fecha_retiro));
  const devueltosDelPeriodo = prestamos.filter((p) => enPeriodo(p.fecha_devolucion));
  const activos = prestamos.filter((p) => !p.fecha_devolucion);
  const atrasados = activos.filter((p) => calcularVencimiento(p, hoy).atrasado);
  const diasDeLectura = promedio(devueltosDelPeriodo.map((p) =>
    differenceInCalendarDays(parseISO(p.fecha_devolucion), parseISO(p.fecha_retiro))
  ));
  const lectores = new Set([...retirosDelPeriodo, ...devueltosDelPeriodo].map((p) => p.id_usuario));

  const porDia = Array.from({ length: dias }, (_, i) => {
    const fecha = subDays(hoy, dias - 1 - i);
    const iso = format(fecha, "yyyy-MM-dd");
    return {
      fecha: iso,
      etiqueta: format(fecha, "d/M"),
      cantidad: retirosDelPeriodo.filter((p) => p.fecha_retiro === iso).length
    };
  });

  const porSucursal = sucursales
    .map((s) => ({ nombre: s.nombre, cantidad: retirosDelPeriodo.filter((p) => p.id_sucursal === s.id).length }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const topLibros = ranking(retirosDelPeriodo, (p) => p.clave_libro, (p) => ({ titulo: p.titulo, autor: p.autor }));
  const topLectores = ranking(retirosDelPeriodo, (p) => p.id_usuario, (p) => ({ nombre: nombreDeUsuario(p.id_usuario) }));

  // ---- Votos de estrellas (no tienen fecha: se cuentan todos) ----
  // El título sale del catálogo cargado, del guardado con el voto o de los préstamos.
  // Nunca se muestra la clave interna ("/works/OL123W").
  const tituloDe = new Map([
    ...Object.entries(titulos),
    ...prestamos.map((p) => [p.clave_libro, p.titulo]),
    ...libros.map((l) => [l.clave, l.titulo])
  ]);
  const listaVotos = Object.entries(votos).flatMap(([clave, porUsuario]) =>
    Object.entries(porUsuario).map(([usuario, puntaje]) => ({ clave, usuario, puntaje }))
  );
  const distribucionVotos = [1, 2, 3, 4, 5].map((estrellas) => ({
    estrellas,
    // Las medias estrellas suben: 3,5 cuenta como 4
    cantidad: listaVotos.filter((v) => Math.ceil(v.puntaje) === estrellas).length
  }));
  const mejorValorados = Object.entries(votos)
    .map(([clave, porUsuario]) => {
      const puntajes = Object.values(porUsuario);
      return { clave, titulo: tituloDe.get(clave) || "Libro sin título registrado", promedio: promedio(puntajes), votos: puntajes.length };
    })
    .filter((l) => l.votos > 0)
    .sort((a, b) => b.promedio - a.promedio || b.votos - a.votos)
    .slice(0, TOP);

  // ---- Demanda sin stock: libros agotados ordenados por cuántas veces se pidieron ----
  const pedidosPorLibro = ranking(prestamos, (p) => p.clave_libro, () => ({}), Infinity);
  const pedidosDe = new Map(pedidosPorLibro.map((r) => [r.clave, r.cantidad]));
  const agotados = libros.filter((l) => stockTotalDe(l) === 0);
  // Solo los que alguien pidió: reponer un libro que nadie busca no es prioridad
  const agotadosConDemanda = agotados
    .map((l) => ({ clave: l.clave, titulo: l.titulo, autor: l.autor, pedidos: pedidosDe.get(l.clave) || 0 }))
    .filter((l) => l.pedidos > 0)
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, TOP);

  // ---- Búsquedas ----
  // La fecha del evento es ISO con hora: se pasa al día local antes de comparar
  const busquedas = eventos.filter((e) =>
    e.tipo === "busqueda" && enPeriodo(format(new Date(e.fecha), "yyyy-MM-dd"))
  );
  const busquedasSinResultados = ranking(busquedas.filter((b) => b.resultados === 0), (b) => b.texto);
  const masBuscadas = ranking(busquedas, (b) => b.texto);

  const metricas = {
    kpis: {
      prestamos: retirosDelPeriodo.length,
      activos: activos.length,
      atrasados: atrasados.length,
      lectoresActivos: lectores.size,
      diasDeLectura,
      votos: listaVotos.length,
      puntajePromedio: promedio(listaVotos.map((v) => v.puntaje)),
      agotados: agotados.length,
      busquedas: busquedas.length
    },
    porDia,
    porSucursal,
    topLibros,
    topLectores,
    distribucionVotos,
    mejorValorados,
    agotadosConDemanda,
    busquedasSinResultados,
    masBuscadas
  };
  metricas.conclusiones = sacarConclusiones(metricas);
  return metricas;
}

// Frases cortas con lo que conviene mirar primero
function sacarConclusiones({ kpis, porSucursal, topLibros, agotadosConDemanda, busquedasSinResultados }) {
  const conclusiones = [];

  if (kpis.prestamos === 0) {
    conclusiones.push("Todavía no hay préstamos en este período.");
  } else {
    const lider = porSucursal[0];
    if (lider?.cantidad > 0) {
      const porcentaje = Math.round((lider.cantidad / kpis.prestamos) * 100);
      conclusiones.push(`${lider.nombre} concentra el ${porcentaje}% de los préstamos.`);
    }
    if (topLibros[0]) {
      conclusiones.push(`El libro más pedido es «${topLibros[0].titulo}» (${topLibros[0].cantidad} préstamos).`);
    }
  }

  if (kpis.atrasados > 0) {
    conclusiones.push(`Hay ${kpis.atrasados} ${kpis.atrasados === 1 ? "préstamo atrasado" : "préstamos atrasados"}: conviene contactar a esos lectores.`);
  }

  const reponer = agotadosConDemanda[0];
  if (reponer) {
    conclusiones.push(`«${reponer.titulo}» está agotado y se pidió ${reponer.pedidos} ${reponer.pedidos === 1 ? "vez" : "veces"}: conviene reponerlo.`);
  }

  const faltante = busquedasSinResultados[0];
  if (faltante) {
    conclusiones.push(`Buscaron «${faltante.clave}» ${faltante.cantidad} ${faltante.cantidad === 1 ? "vez" : "veces"} sin encontrarlo: podría sumarse al catálogo.`);
  }

  return conclusiones;
}

// =========================================================================
// Datos de demostración: para ver el panel completo sin actividad real.
// Se generan siempre iguales (no son al azar) y NO se guardan en ningún lado.
// =========================================================================
export function generarDatosDemo({ libros = [], sucursales = [], hoy = new Date() }) {
  let semilla = 7;
  const siguiente = () => {
    semilla = (semilla * 16807) % 2147483647;
    return (semilla - 1) / 2147483646;
  };
  const elegir = (lista) => lista[Math.floor(siguiente() * lista.length)];
  const fechaHace = (dias) => format(subDays(hoy, dias), "yyyy-MM-dd");

  const usuarios = ["lector", "pato", "valen", "lucia", "marcos", "sofi", "nico", "admin"];
  // Algunos libros son mucho más pedidos que otros, como pasa en una librería real
  const favoritos = libros.slice(0, 6);
  const elegirLibro = () => (siguiente() < 0.55 && favoritos.length ? elegir(favoritos) : elegir(libros));

  const prestamos = [];
  if (libros.length && sucursales.length) {
    for (let i = 0; i < 70; i++) {
      const libro = elegirLibro();
      const sucursal = siguiente() < 0.5 ? sucursales[0] : elegir(sucursales);
      const haceDias = Math.floor(siguiente() * 60);
      const duracion = 3 + Math.floor(siguiente() * 15);
      // Casi todos los préstamos viejos ya se devolvieron; quedan pocos atrasados
      const devuelto = haceDias - duracion >= 0 && (haceDias > 18 ? siguiente() < 0.95 : siguiente() < 0.6);
      prestamos.push({
        id_prestamo: `demo-${i}`,
        id_usuario: elegir(usuarios),
        clave_libro: libro.clave,
        titulo: libro.titulo,
        autor: libro.autor,
        id_sucursal: sucursal.id,
        sucursal: sucursal.nombre,
        fecha_retiro: fechaHace(haceDias),
        fecha_devolucion: devuelto ? fechaHace(haceDias - duracion) : null,
        estado_lectura: devuelto ? "terminado" : "leyendo"
      });
    }
  }

  const votos = {};
  libros.slice(0, 15).forEach((libro, i) => {
    usuarios.slice(0, 2 + (i % 5)).forEach((usuario) => {
      const puntaje = Math.max(1, Math.min(5, Math.round((2.5 + siguiente() * 3) * 2) / 2));
      votos[libro.clave] = { ...votos[libro.clave], [usuario]: puntaje };
    });
  });

  const terminos = [
    ["borges", 3], ["cortázar", 3], ["harry potter", 0], ["rayuela", 1],
    ["el principito", 0], ["garcía márquez", 3], ["harry potter", 0], ["sabato", 2],
    ["isabel allende", 3], ["el principito", 0], ["1984", 0], ["harry potter", 0]
  ];
  const eventos = terminos.map(([texto, resultados], i) => ({
    tipo: "busqueda",
    texto,
    resultados,
    usuario: elegir(usuarios),
    fecha: subDays(hoy, (i * 2) % 25).toISOString()
  }));

  return { prestamos, votos, eventos };
}
