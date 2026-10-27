const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");

function registrarRutasMascotas(enrutador) {
  enrutador.get("/api/mascotas", () => ({
    datos: almacen.listar("mascotas"),
  }));

  enrutador.get("/api/mascotas/:id", (peticion) => {
    const mascota = almacen.buscarPorId("mascotas", peticion.params.id);
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");
    return { datos: mascota };
  });

  // TODO (Módulo Mascotas):
  //   filtro en GET /api/mascotas    (?duenoId=)
  //   POST   /api/mascotas           registrar, validando datos y que el dueño exista
  //   PUT    /api/mascotas/:id       editar
  //   DELETE /api/mascotas/:id       eliminar, junto con sus citas y atenciones
}

module.exports = registrarRutasMascotas;
