const ESTADOS_CITA = ["pendiente", "atendida", "cancelada"];

// toISOString() usa UTC y a veces da el día equivocado, por eso la hora local
function fechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// negativo = días atrás
function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocalISO(fecha);
}

// errores trae un mensaje por campo, ej: { fecha: "La clínica no atiende los domingos." }
class ErrorApi extends Error {
  constructor(estado, mensaje, errores = {}) {
    super(mensaje);
    this.estado = estado;
    this.errores = errores || {};
  }
}

// ej: await api("POST", "/citas", datos). Si el servidor responde error, lanza ErrorApi
async function api(metodo, ruta, datos) {
  const opciones = { method: metodo, headers: {} };
  if (datos !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, opciones);
  } catch {
    throw new ErrorApi(0, "No se pudo conectar con el servidor. Revisa que esté encendido.");
  }

  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo.error || "Ocurrió un error en el servidor.", cuerpo.errores);
  }
  return cuerpo;
}
