const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");
const { texto, esRequerido, esTextoValido, esRutValido, esTelefonoValido, esEmailValido } = require("../validaciones");

// Deja el RUT sin puntos ni guion, para comparar RUT escritos con distinto formato.
function limpiarRut(rut) {
  return texto(rut).replace(/\./g, "").replace(/-/g, "").toUpperCase();
}

// Devuelve un objeto con el mensaje de error de cada campo inválido.
function validarDueno(datos) {
  const errores = {};

  if (!esRequerido(datos.nombre)) errores.nombre = "Escribe el nombre del dueño.";
  else if (!esTextoValido(datos.nombre)) errores.nombre = "El nombre solo puede tener letras y espacios.";

  if (!esRequerido(datos.rut)) errores.rut = "Escribe el RUT del dueño.";
  else if (!esRutValido(datos.rut)) errores.rut = "El RUT no es válido. Revisa el dígito verificador.";

  if (!esRequerido(datos.telefono)) errores.telefono = "Escribe el teléfono del dueño.";
  else if (!esTelefonoValido(datos.telefono)) errores.telefono = "Usa el formato +56 9 1234 5678.";

  if (!esRequerido(datos.email)) errores.email = "Escribe el correo del dueño.";
  else if (!esEmailValido(datos.email)) errores.email = "El correo no tiene un formato válido.";

  return errores;
}

function registrarRutasDuenos(enrutador) {
  enrutador.get("/api/duenos", () => ({
    datos: almacen.listar("duenos"),
  }));

  enrutador.get("/api/duenos/:id", (peticion) => {
    const dueno = almacen.buscarPorId("duenos", peticion.params.id);
    if (!dueno) throw new ErrorHttp(404, "El dueño no existe.");
    return { datos: dueno };
  });

  enrutador.post("/api/duenos", (peticion) => {
    const datos = peticion.cuerpo;
    const errores = validarDueno(datos);
    if (Object.keys(errores).length > 0) {
      throw new ErrorHttp(400, "Revisa los datos del dueño.", errores);
    }

    const repetido = almacen.listar("duenos").some((d) => limpiarRut(d.rut) === limpiarRut(datos.rut));
    if (repetido) {
      throw new ErrorHttp(409, "Ya existe un dueño con este RUT.", { rut: "Ya existe un dueño con este RUT." });
    }

    const dueno = almacen.insertar("duenos", {
      nombre: texto(datos.nombre),
      rut: texto(datos.rut),
      telefono: texto(datos.telefono),
      email: texto(datos.email),
    });
    return { estado: 201, datos: dueno };
  });
}

module.exports = registrarRutasDuenos;
