// Tamaño máximo del cuerpo de una petición (100 KB). Evita que alguien
// envíe datos enormes y deje al servidor sin memoria.
const LIMITE_CUERPO = 100 * 1024;

// Error con código HTTP. Las rutas lo lanzan con throw y server.js
// lo convierte en una respuesta JSON.
//   errores: { campo: "mensaje" } para marcar campos de un formulario.
class ErrorHttp extends Error {
  constructor(estado, mensaje, errores = null) {
    super(mensaje);
    this.estado = estado;
    this.errores = errores;
  }
}

function enviarJSON(res, estado, datos) {
  res.writeHead(estado, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(datos));
}

// Formato de todos los errores de la API:
//   { "error": "mensaje general", "errores": { "campo": "mensaje" } }
function enviarError(res, estado, mensaje, errores = null) {
  const cuerpo = { error: mensaje };
  if (errores) cuerpo.errores = errores;
  enviarJSON(res, estado, cuerpo);
}

// En Node el cuerpo de una petición llega en partes ("chunks").
// Esta función las junta y convierte el texto JSON en un objeto.
function leerCuerpo(req) {
  return new Promise((resolver, rechazar) => {
    let texto = "";
    let demasiadoGrande = false;
    req.setEncoding("utf8");

    // Si se pasa del límite se deja de guardar, pero se termina de recibir
    // para poder responder con un error 413 en vez de cortar la conexión.
    req.on("data", (parte) => {
      if (demasiadoGrande) return;
      texto += parte;
      if (texto.length > LIMITE_CUERPO) {
        demasiadoGrande = true;
        texto = "";
      }
    });

    req.on("end", () => {
      if (demasiadoGrande) {
        return rechazar(new ErrorHttp(413, "Los datos enviados son demasiado grandes."));
      }
      if (texto.trim() === "") return resolver({});
      try {
        const datos = JSON.parse(texto);
        if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
          return rechazar(new ErrorHttp(400, "Los datos deben enviarse como un objeto JSON."));
        }
        resolver(datos);
      } catch {
        rechazar(new ErrorHttp(400, "Los datos enviados no son un JSON válido."));
      }
    });

    req.on("error", rechazar);
  });
}

module.exports = { ErrorHttp, enviarJSON, enviarError, leerCuerpo };
