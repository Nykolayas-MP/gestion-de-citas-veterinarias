const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { crearDatosIniciales } = require("./datos-iniciales");

// Si el archivo no existe, SQLite lo crea. Para volver a los datos de ejemplo basta con borrarlo.
const RUTA_DB = path.join(__dirname, "vetcitas.db");

const db = new DatabaseSync(RUTA_DB);

// SQLite trae las claves foráneas apagadas, hay que activarlas en cada conexión
db.exec("PRAGMA foreign_keys = ON");
db.exec(fs.readFileSync(path.join(__dirname, "esquema.sql"), "utf8"));

// o se guarda todo lo que hace fn, o nada
function transaccion(fn) {
  db.exec("BEGIN");
  try {
    const resultado = fn();
    db.exec("COMMIT");
    return resultado;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function cargarDatosIniciales() {
  const datos = crearDatosIniciales();
  // en este orden por las claves foráneas: primero dueños, al final atenciones
  transaccion(() => {
    for (const tabla of ["duenos", "mascotas", "citas", "atenciones"]) {
      for (const fila of datos[tabla]) {
        const columnas = Object.keys(fila);
        const signos = columnas.map(() => "?").join(", ");
        db.prepare(`INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES (${signos})`).run(...Object.values(fila));
      }
    }
  });
}

const { total } = db.prepare("SELECT COUNT(*) AS total FROM duenos").get();
if (total === 0) cargarDatosIniciales();

module.exports = { db, transaccion };
