const almacen = require("../datos/almacen");
const { ErrorHttp } = require("../utilidades/http");
const { texto, esRequerido, esTextoValido, esNumeroEnRango, EDAD_MAXIMA } = require("../validaciones");

// las mismas del select del formulario
const ESPECIES = ["Perro", "Gato", "Conejo", "Hámster", "Ave", "Otro"];

// "Lúna" y "luna" cuentan como el mismo nombre
function normalizar(valor) {
  return texto(valor).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// excluirId: la mascota que se está editando
function nombreRepetido(nombre, duenoId, excluirId = null) {
  return almacen
    .listar("mascotas", (m) => m.duenoId === duenoId && m.id !== excluirId)
    .some((m) => normalizar(m.nombre) === normalizar(nombre));
}

// Devuelve un objeto con el mensaje de error de cada campo inválido.
function validarMascota(datos) {
  const errores = {};

  if (!esRequerido(datos.nombre)) errores.nombre = "Escribe el nombre de la mascota.";
  else if (!esTextoValido(datos.nombre)) errores.nombre = "El nombre solo puede tener letras y espacios.";

  if (!esRequerido(datos.especie)) errores.especie = "Selecciona la especie.";
  else if (!ESPECIES.includes(texto(datos.especie))) errores.especie = `La especie debe ser: ${ESPECIES.join(", ")}.`;

  if (!esRequerido(datos.raza)) errores.raza = "Escribe la raza (o \"Mestizo\").";
  else if (!esTextoValido(datos.raza)) errores.raza = "La raza solo puede tener letras y espacios.";

  if (!esRequerido(datos.edad)) errores.edad = "Escribe la edad.";
  else if (!esNumeroEnRango(datos.edad, 0, EDAD_MAXIMA)) errores.edad = `La edad debe ser un número entero entre 0 y ${EDAD_MAXIMA}.`;

  return errores;
}

// Deja solo los campos de la mascota que se guardan.
function datosMascota(datos) {
  return {
    nombre: texto(datos.nombre),
    especie: texto(datos.especie),
    raza: texto(datos.raza),
    edad: Number(datos.edad),
  };
}

function registrarRutasMascotas(enrutador) {
  enrutador.get("/api/mascotas", (peticion) => {
    const { duenoId } = peticion.query;
    if (duenoId) {
      return { datos: almacen.listar("mascotas", (m) => m.duenoId === Number(duenoId)) };
    }
    return { datos: almacen.listar("mascotas") };
  });

  enrutador.get("/api/mascotas/:id", (peticion) => {
    const mascota = almacen.buscarPorId("mascotas", peticion.params.id);
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");
    return { datos: mascota };
  });

  enrutador.post("/api/mascotas", (peticion) => {
    const datos = peticion.cuerpo;
    const errores = validarMascota(datos);
    if (!esRequerido(datos.duenoId)) errores.duenoId = "Selecciona un dueño.";
    if (Object.keys(errores).length > 0) {
      throw new ErrorHttp(400, "Revisa los datos de la mascota.", errores);
    }

    const dueno = almacen.buscarPorId("duenos", datos.duenoId);
    if (!dueno) {
      throw new ErrorHttp(404, "El dueño no existe.", { duenoId: "El dueño no existe." });
    }
    if (nombreRepetido(datos.nombre, dueno.id)) {
      const mensaje = "Este dueño ya tiene una mascota con ese nombre.";
      throw new ErrorHttp(409, mensaje, { nombre: mensaje });
    }

    const mascota = almacen.insertar("mascotas", { ...datosMascota(datos), duenoId: Number(datos.duenoId) });
    return { estado: 201, datos: mascota };
  });

  enrutador.put("/api/mascotas/:id", (peticion) => {
    const mascota = almacen.buscarPorId("mascotas", peticion.params.id);
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");

    const errores = validarMascota(peticion.cuerpo);
    if (Object.keys(errores).length > 0) {
      throw new ErrorHttp(400, "Revisa los datos de la mascota.", errores);
    }
    if (nombreRepetido(peticion.cuerpo.nombre, mascota.duenoId, mascota.id)) {
      const mensaje = "El dueño ya tiene otra mascota con ese nombre.";
      throw new ErrorHttp(409, mensaje, { nombre: mensaje });
    }

    return { datos: almacen.actualizar("mascotas", mascota.id, datosMascota(peticion.cuerpo)) };
  });

  enrutador.delete("/api/mascotas/:id", (peticion) => {
    const mascota = almacen.buscarPorId("mascotas", peticion.params.id);
    if (!mascota) throw new ErrorHttp(404, "La mascota no existe.");

    // También se borran sus citas y atenciones, para no dejar datos sin mascota.
    almacen.eliminarDonde("citas", (c) => c.mascotaId === mascota.id);
    almacen.eliminarDonde("atenciones", (a) => a.mascotaId === mascota.id);
    almacen.eliminar("mascotas", mascota.id);
    return { datos: mascota };
  });
}

module.exports = registrarRutasMascotas;
