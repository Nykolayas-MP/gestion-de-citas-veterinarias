const registrarRutasCitas = require("./citas");
const registrarRutasDuenos = require("./duenos");
const registrarRutasMascotas = require("./mascotas");
const registrarRutasAtenciones = require("./atenciones");

// Registra todas las rutas de la API en el enrutador.
function registrarRutas(enrutador) {
  // Ruta de prueba: permite comprobar que el servidor está encendido.
  enrutador.get("/api/salud", () => ({
    datos: { estado: "ok", hora: new Date().toLocaleString("es-CL") },
  }));

  registrarRutasCitas(enrutador);
  registrarRutasDuenos(enrutador);
  registrarRutasMascotas(enrutador);
  registrarRutasAtenciones(enrutador);
}

module.exports = registrarRutas;
