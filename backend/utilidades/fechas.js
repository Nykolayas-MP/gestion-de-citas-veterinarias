// Fecha en formato "YYYY-MM-DD" usando la hora local
// (toISOString() usa UTC y puede entregar el día equivocado).
function fechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Fecha desplazada N días desde hoy (negativo = pasado).
function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocalISO(fecha);
}

// Hora actual en formato "HH:MM".
function horaActual() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}

module.exports = { fechaLocalISO, fechaRelativa, horaActual };
