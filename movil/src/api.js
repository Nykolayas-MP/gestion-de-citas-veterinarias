import { API_URL } from "./config";

// La misma idea que api() en frontend/js/data.js
export class ErrorApi extends Error {
  constructor(estado, mensaje, errores = {}) {
    super(mensaje);
    this.estado = estado;
    this.errores = errores || {};
  }
}

const ESPERA_MAXIMA_MS = 8000;

// ej: await api("POST", "/citas", datos)
export async function api(metodo, ruta, datos) {
  const opciones = { method: metodo, headers: {} };
  if (datos !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(datos);
  }

  // en el celular un fetch sin respuesta puede quedarse colgado mucho rato
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS);
  opciones.signal = control.signal;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  } catch {
    throw new ErrorApi(0, `No se pudo conectar con el servidor (${API_URL}). Revisa que esté encendido y que el celular esté en el mismo Wi-Fi.`);
  } finally {
    clearTimeout(temporizador);
  }

  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo.error || "Ocurrió un error en el servidor.", cuerpo.errores);
  }
  return cuerpo;
}
