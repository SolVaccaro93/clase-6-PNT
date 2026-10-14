// ==========================================
// Fecha de devolución y tardanza (usa date-fns)
// ==========================================

import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export const DIAS_PRESTAMO = 14;

/**
 * Calcula la fecha límite y cuánto falta (o cuánto se atrasó) un préstamo.
 * @param {{ fecha_retiro: string, fecha_devolucion: string | null }} prestamo
 * @param {Date} hoy Fecha de referencia (se puede pasar otra para tests)
 */
export function calcularVencimiento(prestamo, hoy = new Date()) {
  const limite = addDays(parseISO(prestamo.fecha_retiro), DIAS_PRESTAMO);
  const referencia = prestamo.fecha_devolucion ? parseISO(prestamo.fecha_devolucion) : hoy;
  const diasRestantes = differenceInCalendarDays(limite, referencia);

  return {
    fechaLimite: format(limite, "yyyy-MM-dd"),
    diasRestantes,
    atrasado: diasRestantes < 0,
    texto: textoVencimiento(diasRestantes, Boolean(prestamo.fecha_devolucion))
  };
}

function textoVencimiento(dias, devuelto) {
  if (devuelto) return dias < 0 ? `Devuelto con ${-dias} día(s) de atraso` : "Devuelto a tiempo";
  if (dias > 0) return `Te quedan ${dias} día(s) para devolverlo`;
  if (dias === 0) return "Vence hoy";
  return `Atrasado ${-dias} día(s)`;
}
