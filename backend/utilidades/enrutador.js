// Guarda qué función atiende cada método + URL.
// Lo que empieza con ":" es parámetro: /api/citas/:id → peticion.params.id
// Ojo: se revisan en orden, por eso /api/citas/horarios va antes que /api/citas/:id
function crearEnrutador() {
  const rutas = [];

  function separar(ruta) {
    return ruta.split("/").filter((parte) => parte !== "");
  }

  function agregar(metodo, patron, manejador) {
    rutas.push({ metodo, partes: separar(patron), manejador });
  }

  function coincidir(partesPatron, partesUrl) {
    if (partesPatron.length !== partesUrl.length) return null;
    const params = {};
    for (let i = 0; i < partesPatron.length; i++) {
      const patron = partesPatron[i];
      if (patron.startsWith(":")) {
        params[patron.slice(1)] = decodeURIComponent(partesUrl[i]);
      } else if (patron !== partesUrl[i]) {
        return null;
      }
    }
    return params;
  }

  // devuelve { manejador, params } o null
  function resolver(metodo, ruta) {
    const partesUrl = separar(ruta);
    for (const r of rutas) {
      if (r.metodo !== metodo) continue;
      const params = coincidir(r.partes, partesUrl);
      if (params) return { manejador: r.manejador, params };
    }
    return null;
  }

  // sirve para responder 405 en vez de 404
  function existeRuta(ruta) {
    const partesUrl = separar(ruta);
    return rutas.some((r) => coincidir(r.partes, partesUrl) !== null);
  }

  return {
    get: (patron, manejador) => agregar("GET", patron, manejador),
    post: (patron, manejador) => agregar("POST", patron, manejador),
    put: (patron, manejador) => agregar("PUT", patron, manejador),
    patch: (patron, manejador) => agregar("PATCH", patron, manejador),
    delete: (patron, manejador) => agregar("DELETE", patron, manejador),
    resolver,
    existeRuta,
  };
}

module.exports = { crearEnrutador };
