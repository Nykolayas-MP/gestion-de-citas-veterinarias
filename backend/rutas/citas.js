const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");

// Cómo se escribe una ruta:
//   - recibe "peticion" con: params (de la URL), query (?estado=...) y cuerpo (JSON enviado)
//   - devuelve { estado, datos }  (estado es opcional, por defecto 200)
//   - para responder con error: throw new ErrorHttp(codigo, "mensaje", { campo: "mensaje" })
function registrarRutasCitas(enrutador) {
  enrutador.get("/api/citas", () => ({
    datos: almacen.listar("citas"),
  }));

  // TODO (Módulo Citas): GET /api/citas/horarios?fecha=  (registrar ANTES de /api/citas/:id)

  enrutador.get("/api/citas/:id", (peticion) => {
    const cita = almacen.buscarPorId("citas", peticion.params.id);
    if (!cita) throw new ErrorHttp(404, "La cita no existe.");
    return { datos: cita };
  });

  // TODO (Módulo Citas):
  //   filtros en GET /api/citas  (?estado=, ?fecha=, ?mascotaId=)
  //   POST  /api/citas               agendar, con todas las validaciones
  //   PUT   /api/citas/:id           modificar (solo citas pendientes)
  //   PATCH /api/citas/:id/cancelar  cancelar (solo citas pendientes)
}

module.exports = registrarRutasCitas;
