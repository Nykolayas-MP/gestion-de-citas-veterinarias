const almacen = require("../datos/almacen");
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

function registrarRutasAtenciones(enrutador) {
  enrutador.get("/api/mascotas/:id/atenciones", (peticion) => {
    const mascota = almacen.buscarPorId("mascotas", peticion.params.id);
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");
    return { datos: almacen.listar("atenciones", (a) => a.mascotaId === mascota.id) };
  });

  enrutador.post("/api/atenciones", (peticion) => {
    const datos = peticion.cuerpo;
    if (!esRequerido(datos.citaId)) {
      throw new ErrorHttp(400, "Indica la cita que se está atendiendo.", { citaId: "Indica la cita que se está atendiendo." });
    }
    const cita = almacen.buscarPorId("citas", datos.citaId);
    if (!cita) throw new ErrorHttp(404, "La cita no existe.");
    if (cita.estado !== "pendiente") throw new ErrorHttp(409, "La cita ya fue atendida o cancelada.");
    if (cita.fecha > fechaLocalISO()) throw new ErrorHttp(400, "La cita todavía no llega. Solo se puede atender desde su fecha.");

    const errores = validarAtencion(datos);
    if (Object.keys(errores).length > 0) {
      throw new ErrorHttp(400, "Revisa los datos de la atención.", errores);
    }

    const atencion = almacen.insertar("atenciones", {
      citaId: cita.id,
      mascotaId: cita.mascotaId,
      fecha: cita.fecha,
      diagnostico: texto(datos.diagnostico),
      tratamiento: texto(datos.tratamiento),
      medicamentos: texto(datos.medicamentos),
    });
    almacen.actualizar("citas", cita.id, { estado: "atendida" });
    return { estado: 201, datos: atencion };
  });
}

module.exports = registrarRutasAtenciones;
