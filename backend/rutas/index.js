const registrarRutasCitas = require("./citas");
const registrarRutasDuenos = require("./duenos");
const registrarRutasMascotas = require("./mascotas");
const registrarRutasAtenciones = require("./atenciones");

function registrarRutas(enrutador) {
  // para probar que el servidor está encendido
  enrutador.get("/api/salud", () => ({
    datos: { estado: "ok", hora: new Date().toLocaleString("es-CL") },
  }));

  registrarRutasCitas(enrutador);
  registrarRutasDuenos(enrutador);
  registrarRutasMascotas(enrutador);
  registrarRutasAtenciones(enrutador);
}

module.exports = registrarRutas;
