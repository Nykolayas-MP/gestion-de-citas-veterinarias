const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");

function registrarRutasDuenos(enrutador) {
  enrutador.get("/api/duenos", () => ({
    datos: almacen.listar("duenos"),
  }));

  enrutador.get("/api/duenos/:id", (peticion) => {
    const dueno = almacen.buscarPorId("duenos", peticion.params.id);
    if (!dueno) throw new ErrorHttp(404, "El dueño no existe.");
    return { datos: dueno };
  });

  // TODO (Módulo Mascotas):
  //   POST /api/duenos  registrar, validando nombre, RUT (válido y no repetido), teléfono y email
}

module.exports = registrarRutasDuenos;
