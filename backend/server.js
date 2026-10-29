const http = require("http");
const { crearEnrutador } = require("./utilidades/enrutador");
const { ErrorHttp, enviarJSON, enviarError, leerCuerpo } = require("./utilidades/http");
const { servirArchivo } = require("./utilidades/archivos");
const registrarRutas = require("./rutas");

const PUERTO = process.env.PORT || 3000;
const METODOS_CON_CUERPO = ["POST", "PUT", "PATCH"];

const enrutador = crearEnrutador();
registrarRutas(enrutador);

// CORS, para que la app del Taller 4 pueda usar la API
function permitirOtrosOrigenes(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function atenderApi(req, res, url) {
  const ruta = enrutador.resolver(req.method, url.pathname);
  if (!ruta) {
    // si la URL existe con otro método es 405, si no 404
    return enrutador.existeRuta(url.pathname)
      ? enviarError(res, 405, `El método ${req.method} no está permitido en esta ruta.`)
      : enviarError(res, 404, "La ruta de la API no existe.");
  }

  try {
    const peticion = {
      params: ruta.params,
      query: Object.fromEntries(url.searchParams),
      cuerpo: METODOS_CON_CUERPO.includes(req.method) ? await leerCuerpo(req) : {},
    };
    const respuesta = await ruta.manejador(peticion);
    enviarJSON(res, respuesta.estado || 200, respuesta.datos);
  } catch (error) {
    if (error instanceof ErrorHttp) {
      enviarError(res, error.estado, error.message, error.errores);
    } else {
      // un bug: se ve en la consola y el servidor sigue arriba
      console.error(error);
      enviarError(res, 500, "Ocurrió un error interno en el servidor.");
    }
  }
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  res.on("finish", () => {
    console.log(`${req.method} ${url.pathname}${url.search} → ${res.statusCode}`);
  });

  permitirOtrosOrigenes(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname.startsWith("/api/")) {
    return atenderApi(req, res, url);
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return servirArchivo(res, url.pathname);
  }
  enviarError(res, 405, "Método no permitido.");
});

servidor.listen(PUERTO, () => {
  console.log(`Servidor VetCitas en http://localhost:${PUERTO}`);
  console.log("Presiona Ctrl + C para detenerlo.");
});
