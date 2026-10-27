const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");

function registrarRutasAtenciones(enrutador) {
  enrutador.get("/api/mascotas/:id/atenciones", (peticion) => {
    const mascota = almacen.buscarPorId("mascotas", peticion.params.id);
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");
    return { datos: almacen.listar("atenciones", (a) => a.mascotaId === mascota.id) };
  });

  // TODO (Módulo Mascotas):
  //   POST /api/atenciones  registrar la atención de una cita pendiente cuya fecha ya llegó,
  //                         y marcar esa cita como "atendida"
}

module.exports = registrarRutasAtenciones;
