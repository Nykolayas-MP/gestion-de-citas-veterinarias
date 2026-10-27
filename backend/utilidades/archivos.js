const fs = require("fs/promises");
const path = require("path");

const CARPETA_FRONTEND = path.join(__dirname, "..", "..", "frontend");

// Tipo de contenido según la extensión, para que el navegador sepa qué recibe.
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function responderTexto(res, estado, texto) {
  res.writeHead(estado, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(texto);
}

// Envía un archivo de la carpeta frontend. "/" entrega index.html.
async function servirArchivo(res, rutaUrl) {
  let relativa;
  try {
    relativa = decodeURIComponent(rutaUrl);
  } catch {
    return responderTexto(res, 400, "Dirección no válida.");
  }
  if (relativa.endsWith("/")) relativa += "index.html";

  // path.join resuelve los ".." y aquí se comprueba que el resultado
  // siga dentro de frontend/. Así nadie puede leer otros archivos del equipo.
  const rutaCompleta = path.join(CARPETA_FRONTEND, relativa);
  if (!rutaCompleta.startsWith(CARPETA_FRONTEND + path.sep)) {
    return responderTexto(res, 403, "Acceso no permitido.");
  }

  try {
    const contenido = await fs.readFile(rutaCompleta);
    const tipo = TIPOS[path.extname(rutaCompleta).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": tipo });
    res.end(contenido);
  } catch {
    responderTexto(res, 404, "Página no encontrada.");
  }
}

module.exports = { servirArchivo };
