const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");
const { fechaLocalISO, horaActual } = require("../utilidades/fechas");
const {
  HORARIO_APERTURA,
  HORARIO_CIERRE,
  MAX_DIAS_ANTICIPACION,
  ESTADOS_CITA,
  texto,
  esRequerido,
  esFechaValida,
  esHoraValida,
  esFechaNoPasada,
  esFechaDentroDelLimite,
  esDiaHabil,
  esHoraEnHorario,
} = require("../validaciones");

const DURACION_CITA_MINUTOS = 30;
const MIN_CARACTERES_MOTIVO = 3;
const MAX_CARACTERES_MOTIVO = 60;
const MAX_OBSERVACIONES = 200;

/* ---------- Horarios ---------- */

function aMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function aHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// Todos los bloques de la jornada: 09:00, 09:30, ..., 18:30
function generarHorarios() {
  const horarios = [];
  for (let minutos = aMinutos(HORARIO_APERTURA); minutos < aMinutos(HORARIO_CIERRE); minutos += DURACION_CITA_MINUTOS) {
    horarios.push(aHora(minutos));
  }
  return horarios;
}

// Citas que bloquean un horario ese día: todas menos las canceladas.
// "excluirId" deja fuera la cita que se está modificando, para que no choque consigo misma.
function citasActivasDelDia(fecha, excluirId = null) {
  return almacen.listar(
    "citas",
    (c) => c.fecha === fecha && c.estado !== "cancelada" && c.id !== excluirId
  );
}

function esHoraPasada(fecha, hora) {
  return fecha === fechaLocalISO() && hora <= horaActual();
}

/* ---------- Validaciones ---------- */

// Devuelve el mensaje de error de la fecha, o "" si es válida.
function errorFecha(fecha) {
  if (!esRequerido(fecha)) return "Elige una fecha.";
  if (!esFechaValida(fecha)) return "La fecha debe tener el formato AAAA-MM-DD.";
  if (!esFechaNoPasada(fecha)) return "La fecha no puede ser anterior a hoy.";
  if (!esFechaDentroDelLimite(fecha)) return `Solo se puede agendar hasta ${MAX_DIAS_ANTICIPACION} días adelante.`;
  if (!esDiaHabil(fecha)) return "La clínica no atiende los domingos.";
  return "";
}

// Revisa los datos de una cita. "citaId" se usa al modificar una cita existente.
// Devuelve { errores, conflicto }: los errores son 400 y el conflicto es 409.
function validarCita(datos, citaId = null) {
  const errores = {};

  const mascota = almacen.buscarPorId("mascotas", datos.mascotaId);
  if (!esRequerido(datos.mascotaId)) errores.mascotaId = "Selecciona la mascota.";
  else if (!mascota) errores.mascotaId = "La mascota no existe.";

  const mensajeFecha = errorFecha(datos.fecha);
  if (mensajeFecha) errores.fecha = mensajeFecha;

  const hora = texto(datos.hora);
  if (!esRequerido(hora)) errores.hora = "Elige una hora.";
  else if (!esHoraValida(hora)) errores.hora = "La hora debe tener el formato HH:MM.";
  else if (!esHoraEnHorario(hora)) errores.hora = `Fuera del horario de atención (${HORARIO_APERTURA} a ${HORARIO_CIERRE}).`;
  else if (!generarHorarios().includes(hora)) errores.hora = `Las citas son cada ${DURACION_CITA_MINUTOS} minutos (por ejemplo 10:00 o 10:30).`;
  else if (!mensajeFecha && esHoraPasada(texto(datos.fecha), hora)) errores.hora = "Esa hora ya pasó.";

  const motivo = texto(datos.motivo);
  if (!esRequerido(motivo)) errores.motivo = "Indica el motivo de la consulta.";
  else if (motivo.length < MIN_CARACTERES_MOTIVO) errores.motivo = `Escribe al menos ${MIN_CARACTERES_MOTIVO} caracteres.`;
  else if (motivo.length > MAX_CARACTERES_MOTIVO) errores.motivo = `Máximo ${MAX_CARACTERES_MOTIVO} caracteres.`;

  if (texto(datos.observaciones).length > MAX_OBSERVACIONES) {
    errores.observaciones = `Máximo ${MAX_OBSERVACIONES} caracteres.`;
  }

  if (Object.keys(errores).length > 0) return { errores, conflicto: null };

  // Con los datos correctos, se revisa que no choquen con otras citas.
  const delDia = citasActivasDelDia(texto(datos.fecha), citaId);
  if (delDia.some((c) => c.hora === hora)) {
    return { errores, conflicto: { hora: "Ese horario ya fue tomado. Elige otro." } };
  }
  const otra = delDia.find((c) => c.mascotaId === mascota.id && c.estado === "pendiente");
  if (otra) {
    return { errores, conflicto: { fecha: `${mascota.nombre} ya tiene una cita pendiente ese día a las ${otra.hora}.` } };
  }

  return { errores, conflicto: null };
}

// Lanza el error que corresponda si los datos de la cita no sirven.
function comprobarCita(datos, citaId = null) {
  const { errores, conflicto } = validarCita(datos, citaId);
  if (Object.keys(errores).length > 0) {
    throw new ErrorHttp(400, "Revisa los datos de la cita.", errores);
  }
  if (conflicto) {
    throw new ErrorHttp(409, Object.values(conflicto)[0], conflicto);
  }
}

// Deja solo los campos de la cita que se guardan.
function datosCita(datos) {
  return {
    mascotaId: Number(datos.mascotaId),
    fecha: texto(datos.fecha),
    hora: texto(datos.hora),
    motivo: texto(datos.motivo),
    observaciones: texto(datos.observaciones),
  };
}

// Busca la cita y comprueba que siga pendiente.
function buscarCitaPendiente(id, accion) {
  const cita = almacen.buscarPorId("citas", id);
  if (!cita) throw new ErrorHttp(404, "La cita no existe.");
  if (cita.estado !== "pendiente") {
    throw new ErrorHttp(409, `Esta cita está ${cita.estado}. Solo las citas pendientes se pueden ${accion}.`);
  }
  return cita;
}

// Cómo se escribe una ruta:
//   - recibe "peticion" con: params (de la URL), query (?estado=...) y cuerpo (JSON enviado)
//   - devuelve { estado, datos }  (estado es opcional, por defecto 200)
//   - para responder con error: throw new ErrorHttp(codigo, "mensaje", { campo: "mensaje" })
function registrarRutasCitas(enrutador) {
  // Filtros opcionales: /api/citas?estado=pendiente&fecha=2026-10-30&mascotaId=2
  enrutador.get("/api/citas", (peticion) => {
    const { estado, fecha, mascotaId } = peticion.query;

    if (estado && !ESTADOS_CITA.includes(estado)) {
      throw new ErrorHttp(400, `El estado debe ser: ${ESTADOS_CITA.join(", ")}.`);
    }
    if (fecha && !esFechaValida(fecha)) {
      throw new ErrorHttp(400, "La fecha debe tener el formato AAAA-MM-DD.");
    }

    const citas = almacen.listar(
      "citas",
      (c) =>
        (!estado || c.estado === estado) &&
        (!fecha || c.fecha === fecha) &&
        (!mascotaId || c.mascotaId === Number(mascotaId))
    );
    return { datos: citas };
  });

  // Horarios de un día y si están libres: /api/citas/horarios?fecha=2026-10-30
  // Al modificar una cita se agrega &excluir=ID para que su propio horario aparezca libre.
  // Va antes de /api/citas/:id para que "horarios" no se lea como un id.
  enrutador.get("/api/citas/horarios", (peticion) => {
    const { fecha, excluir } = peticion.query;
    const mensaje = errorFecha(fecha);
    if (mensaje) throw new ErrorHttp(400, mensaje, { fecha: mensaje });

    const ocupadas = citasActivasDelDia(fecha, excluir ? Number(excluir) : null).map((c) => c.hora);
    const horarios = generarHorarios().map((hora) => {
      if (ocupadas.includes(hora)) return { hora, disponible: false, motivo: "ocupado" };
      if (esHoraPasada(fecha, hora)) return { hora, disponible: false, motivo: "ya pasó" };
      return { hora, disponible: true };
    });
    return { datos: horarios };
  });

  enrutador.get("/api/citas/:id", (peticion) => {
    const cita = almacen.buscarPorId("citas", peticion.params.id);
    if (!cita) throw new ErrorHttp(404, "La cita no existe.");
    return { datos: cita };
  });

  enrutador.post("/api/citas", (peticion) => {
    comprobarCita(peticion.cuerpo);
    const cita = almacen.insertar("citas", { ...datosCita(peticion.cuerpo), estado: "pendiente" });
    return { estado: 201, datos: cita };
  });

  enrutador.put("/api/citas/:id", (peticion) => {
    const cita = buscarCitaPendiente(peticion.params.id, "modificar");
    comprobarCita(peticion.cuerpo, cita.id);
    return { datos: almacen.actualizar("citas", cita.id, datosCita(peticion.cuerpo)) };
  });

  enrutador.patch("/api/citas/:id/cancelar", (peticion) => {
    const cita = buscarCitaPendiente(peticion.params.id, "cancelar");
    return { datos: almacen.actualizar("citas", cita.id, { estado: "cancelada" }) };
  });
}

module.exports = registrarRutasCitas;
