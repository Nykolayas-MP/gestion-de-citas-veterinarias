const { db, transaccion } = require("../datos/db");
const { ErrorHttp } = require("../utilidades/http");
const { texto, esRequerido } = require("../validaciones");
const { fechaLocalISO } = require("../utilidades/fechas");

const MIN_CARACTERES_ATENCION = 5;

// Devuelve un objeto con el mensaje de error de cada campo inválido.
function validarAtencion(datos) {
  const errores = {};

  if (!esRequerido(datos.diagnostico)) errores.diagnostico = "Escribe el diagnóstico.";
  else if (texto(datos.diagnostico).length < MIN_CARACTERES_ATENCION) errores.diagnostico = `Escribe al menos ${MIN_CARACTERES_ATENCION} caracteres.`;

  if (!esRequerido(datos.tratamiento)) errores.tratamiento = "Escribe el tratamiento.";
  else if (texto(datos.tratamiento).length < MIN_CARACTERES_ATENCION) errores.tratamiento = `Escribe al menos ${MIN_CARACTERES_ATENCION} caracteres.`;

  return errores;
}

// mascotaId y fecha vienen de la cita, la atención no los guarda
const SELECT_ATENCION = `
  SELECT a.id, a.citaId, c.mascotaId, c.fecha, a.diagnostico, a.tratamiento, a.medicamentos
  FROM atenciones a
  JOIN citas c ON c.id = a.citaId`;

function registrarRutasAtenciones(enrutador) {
  enrutador.get("/api/mascotas/:id/atenciones", (peticion) => {
    const mascota = db.prepare("SELECT id FROM mascotas WHERE id = ?").get(Number(peticion.params.id));
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");
    return { datos: db.prepare(`${SELECT_ATENCION} WHERE c.mascotaId = ? ORDER BY a.id`).all(mascota.id) };
  });

  enrutador.post("/api/atenciones", (peticion) => {
    const datos = peticion.cuerpo;
    if (!esRequerido(datos.citaId)) {
      throw new ErrorHttp(400, "Indica la cita que se está atendiendo.", { citaId: "Indica la cita que se está atendiendo." });
    }
    const cita = db.prepare("SELECT * FROM citas WHERE id = ?").get(Number(datos.citaId));
    if (!cita) throw new ErrorHttp(404, "La cita no existe.");
    if (cita.estado !== "pendiente") throw new ErrorHttp(409, "La cita ya fue atendida o cancelada.");
    if (cita.fecha > fechaLocalISO()) throw new ErrorHttp(400, "La cita todavía no llega. Solo se puede atender desde su fecha.");

    const errores = validarAtencion(datos);
    if (Object.keys(errores).length > 0) {
      throw new ErrorHttp(400, "Revisa los datos de la atención.", errores);
    }

    // si falla el UPDATE tampoco queda guardada la atención
    const id = transaccion(() => {
      const nueva = db
        .prepare("INSERT INTO atenciones (citaId, diagnostico, tratamiento, medicamentos) VALUES (?, ?, ?, ?) RETURNING id")
        .get(cita.id, texto(datos.diagnostico), texto(datos.tratamiento), texto(datos.medicamentos));
      db.prepare("UPDATE citas SET estado = 'atendida' WHERE id = ?").run(cita.id);
      return nueva.id;
    });
    return { estado: 201, datos: db.prepare(`${SELECT_ATENCION} WHERE a.id = ?`).get(id) };
  });
}

module.exports = registrarRutasAtenciones;
