// =========================================================================
// Requerimiento: Módulo social - Mis amigos y estados de lectura - Sol
// =========================================================================
// Datos simulados con la forma del modelo (Amistad y Lectura/Préstamo) hasta que
// estén los endpoints de Valentín. Los métodos son async para que el cambio a
// fetch no obligue a modificar las vistas.

import { differenceInCalendarDays, parseISO } from "date-fns";
import { BibliotecaService } from "./bibliotecaService.js";

const USUARIOS = [
  { id_usuario: "lector", nombre: "Sol Vaccaro" },
  { id_usuario: "admin", nombre: "Matías Gratz" },
  { id_usuario: "pato", nombre: "Patricio Araquistain" },
  { id_usuario: "valen", nombre: "Valentín" },
  { id_usuario: "lucia", nombre: "Lucía Fernández" }
];

const AMISTADES = [
  { id_amistad: 1, id_usuario_solicita: "lector", id_usuario_amigo: "pato", estado: "aceptada" },
  { id_amistad: 2, id_usuario_solicita: "valen", id_usuario_amigo: "lector", estado: "aceptada" },
  { id_amistad: 3, id_usuario_solicita: "lector", id_usuario_amigo: "admin", estado: "aceptada" },
  { id_amistad: 4, id_usuario_solicita: "lucia", id_usuario_amigo: "lector", estado: "pendiente" },
  { id_amistad: 5, id_usuario_solicita: "admin", id_usuario_amigo: "lucia", estado: "aceptada" },
  { id_amistad: 6, id_usuario_solicita: "admin", id_usuario_amigo: "valen", estado: "aceptada" },
  { id_amistad: 7, id_usuario_solicita: "admin", id_usuario_amigo: "pato", estado: "aceptada" }
];

const LECTURAS = [
  { id_prestamo: 1, id_usuario: "pato", titulo: "Rayuela", autor: "Julio Cortázar", sucursal: "Centro", fecha_retiro: "2026-09-28", fecha_devolucion: null, estado_lectura: "leyendo" },
  { id_prestamo: 2, id_usuario: "pato", titulo: "El túnel", autor: "Ernesto Sabato", sucursal: "Belgrano", fecha_retiro: "2026-08-30", fecha_devolucion: "2026-09-20", estado_lectura: "terminado" },
  { id_prestamo: 3, id_usuario: "valen", titulo: "Cien años de soledad", autor: "Gabriel García Márquez", sucursal: "Floresta", fecha_retiro: "2026-09-15", fecha_devolucion: "2026-10-02", estado_lectura: "terminado" },
  { id_prestamo: 4, id_usuario: "valen", titulo: "Ficciones", autor: "Jorge Luis Borges", sucursal: "Centro", fecha_retiro: "2026-10-03", fecha_devolucion: null, estado_lectura: "leyendo" },
  { id_prestamo: 5, id_usuario: "admin", titulo: "Don Quijote de la Mancha", autor: "Miguel de Cervantes", sucursal: "Belgrano", fecha_retiro: "2026-09-01", fecha_devolucion: "2026-09-25", estado_lectura: "terminado" },
  { id_prestamo: 6, id_usuario: "lucia", titulo: "Orgullo y prejuicio", autor: "Jane Austen", sucursal: "Floresta", fecha_retiro: "2026-09-22", fecha_devolucion: null, estado_lectura: "leyendo" },
  { id_prestamo: 7, id_usuario: "lector", titulo: "El principito", autor: "Antoine de Saint-Exupéry", sucursal: "Centro", fecha_retiro: "2026-09-10", fecha_devolucion: "2026-09-18", estado_lectura: "terminado" }
];

// Portadas de las lecturas de prueba (OpenLibrary Covers), porque esos libros no están en el catálogo.
const urlPortada = (idPortada) => `https://covers.openlibrary.org/b/id/${idPortada}-L.jpg`;
const PORTADAS_EJEMPLO = {
  "Rayuela": urlPortada(1047466),
  "El túnel": urlPortada(7913225),
  "Cien años de soledad": urlPortada(12627383),
  "Ficciones": urlPortada(10832290),
  "Don Quijote de la Mancha": urlPortada(13478610),
  "Orgullo y prejuicio": urlPortada(15240603),
  "El principito": urlPortada(13499066)
};

function nombreDe(idUsuario) {
  return USUARIOS.find((u) => u.id_usuario === idUsuario)?.nombre || idUsuario;
}

export const AmigosService = {
  // Amigos con amistad aceptada (en cualquier dirección) y sus lecturas
  async getAmigosConLecturas(idUsuario) {
    const idsAmigos = AMISTADES
      .filter((a) => a.estado === "aceptada")
      .filter((a) => a.id_usuario_solicita === idUsuario || a.id_usuario_amigo === idUsuario)
      .map((a) => (a.id_usuario_solicita === idUsuario ? a.id_usuario_amigo : a.id_usuario_solicita));

    return idsAmigos.map((id) => {
      const lecturas = [...LECTURAS.filter((l) => l.id_usuario === id), ...BibliotecaService.obtenerPrestamos(id)];
      return {
        id_usuario: id,
        nombre: nombreDe(id),
        leyendo: lecturas.filter((l) => l.estado_lectura === "leyendo"),
        terminados: lecturas.filter((l) => l.estado_lectura === "terminado")
      };
    });
  },

  // =========================================================================
  // Requerimiento: Feed tipo Instagram (cuándo leyeron los libros) - Sol
  // =========================================================================
  // Cada lectura genera hasta dos publicaciones: "empezó a leer" (fecha de retiro)
  // y "terminó de leer" (fecha de devolución). Incluye al usuario y a sus amigos,
  // ordenadas de la más nueva a la más vieja.
  async getFeedActividad(idUsuario) {
    // Las portadas salen del catálogo; si la API falla el feed se muestra igual sin ellas.
    try {
      await BibliotecaService.cargarLibros(25);
    } catch {
      // sin portadas
    }
    const catalogo = BibliotecaService.buscar();
    const amigos = await this.getAmigosConLecturas(idUsuario);
    const propias = [...LECTURAS.filter((l) => l.id_usuario === idUsuario), ...BibliotecaService.obtenerPrestamos(idUsuario)];

    const lecturasPorUsuario = [
      { id_usuario: idUsuario, nombre: nombreDe(idUsuario), lecturas: propias },
      ...amigos.map((a) => ({ id_usuario: a.id_usuario, nombre: a.nombre, lecturas: [...a.leyendo, ...a.terminados] }))
    ];

    const publicaciones = lecturasPorUsuario.flatMap(({ id_usuario, nombre, lecturas }) =>
      lecturas.flatMap((lectura) => {
        const libro = catalogo.find((l) => l.clave === lectura.clave_libro) || null;
        const base = {
          id_usuario,
          nombre,
          esPropia: id_usuario === idUsuario,
          titulo: lectura.titulo,
          autor: lectura.autor,
          sucursal: lectura.sucursal,
          portada: libro?.portadaGrande || libro?.portada || PORTADAS_EJEMPLO[lectura.titulo] || null,
          id_libro: libro?.id ?? null
        };

        const eventos = [{ ...base, id: `${lectura.id_prestamo}-empezo`, tipo: "empezo", fecha: lectura.fecha_retiro }];
        if (lectura.fecha_devolucion) {
          eventos.push({
            ...base,
            id: `${lectura.id_prestamo}-termino`,
            tipo: "termino",
            fecha: lectura.fecha_devolucion,
            diasDeLectura: differenceInCalendarDays(parseISO(lectura.fecha_devolucion), parseISO(lectura.fecha_retiro))
          });
        }
        return eventos;
      })
    );

    // Más nuevas primero; el mismo día, "terminó" queda arriba de "empezó".
    const orden = { termino: 0, empezo: 1 };
    return publicaciones.sort((a, b) => b.fecha.localeCompare(a.fecha) || orden[a.tipo] - orden[b.tipo]);
  },

  // Solicitudes que recibió el usuario y todavía no aceptó
  async getSolicitudesPendientes(idUsuario) {
    return AMISTADES
      .filter((a) => a.estado === "pendiente" && a.id_usuario_amigo === idUsuario)
      .map((a) => ({ id_amistad: a.id_amistad, nombre: nombreDe(a.id_usuario_solicita) }));
  }
};
