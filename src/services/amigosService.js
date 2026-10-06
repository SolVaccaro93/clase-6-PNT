// =========================================================================
// Requerimiento: Módulo social - Mis amigos y estados de lectura - Sol
// =========================================================================
// Datos simulados con la forma del modelo (Amistad y Lectura/Préstamo) hasta que
// estén los endpoints de Valentín. Los métodos son async para que el cambio a
// fetch no obligue a modificar las vistas.

const USUARIOS = [
  { id_usuario: "lector", nombre: "Sol Vaccaro" },
  { id_usuario: "admin", nombre: "Matías Gratz" },
  { id_usuario: "pato", nombre: "Patricio" },
  { id_usuario: "valen", nombre: "Valentín" },
  { id_usuario: "lucia", nombre: "Lucía Fernández" }
];

const AMISTADES = [
  { id_amistad: 1, id_usuario_solicita: "lector", id_usuario_amigo: "pato", estado: "aceptada" },
  { id_amistad: 2, id_usuario_solicita: "valen", id_usuario_amigo: "lector", estado: "aceptada" },
  { id_amistad: 3, id_usuario_solicita: "lector", id_usuario_amigo: "admin", estado: "aceptada" },
  { id_amistad: 4, id_usuario_solicita: "lucia", id_usuario_amigo: "lector", estado: "pendiente" },
  { id_amistad: 5, id_usuario_solicita: "admin", id_usuario_amigo: "lucia", estado: "aceptada" },
  { id_amistad: 6, id_usuario_solicita: "admin", id_usuario_amigo: "valen", estado: "aceptada" }
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
      const lecturas = LECTURAS.filter((l) => l.id_usuario === id);
      return {
        id_usuario: id,
        nombre: nombreDe(id),
        leyendo: lecturas.filter((l) => l.estado_lectura === "leyendo"),
        terminados: lecturas.filter((l) => l.estado_lectura === "terminado")
      };
    });
  },

  // Solicitudes que recibió el usuario y todavía no aceptó
  async getSolicitudesPendientes(idUsuario) {
    return AMISTADES
      .filter((a) => a.estado === "pendiente" && a.id_usuario_amigo === idUsuario)
      .map((a) => ({ id_amistad: a.id_amistad, nombre: nombreDe(a.id_usuario_solicita) }));
  }
};
