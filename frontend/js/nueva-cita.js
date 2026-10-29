const MOTIVOS = [
  "Consulta general",
  "Vacunación",
  "Control",
  "Desparasitación",
  "Cirugía",
  "Urgencia",
  "Otro",
];
const MAX_DIAS_ANTICIPACION = 90;
const MAX_OBSERVACIONES = 200;

// null si es una cita nueva
let citaEditando = null;

let duenos = [];
let mascotas = [];
let citas = [];

// ej: [{ hora: "09:00", disponible: true }, { hora: "09:30", disponible: false, motivo: "ocupado" }]
let horarios = [];

// si cambian de fecha rápido, ignoramos respuestas viejas
let pedidoHoras = 0;

const campos = {
  dueno: document.getElementById("dueno"),
  mascota: document.getElementById("mascota"),
  fecha: document.getElementById("fecha"),
  hora: document.getElementById("hora"),
  motivo: document.getElementById("motivo"),
  motivoOtro: document.getElementById("motivo-otro"),
  observaciones: document.getElementById("observaciones"),
};

function fechaMaxima() {
  return fechaRelativa(MAX_DIAS_ANTICIPACION);
}

function buscarMascota(id) {
  return mascotas.find((m) => m.id === Number(id)) || null;
}

/* ---------- Datos ---------- */

async function cargarDatos() {
  [duenos, mascotas, citas] = await Promise.all([
    api("GET", "/duenos"),
    api("GET", "/mascotas"),
    api("GET", "/citas?estado=pendiente"),
  ]);
}

/* ---------- Reglas de negocio ---------- */

// otra cita pendiente de la misma mascota ese día (sin contar la que se edita)
function citaDeMascotaEseDia(mascotaId, fecha) {
  return (
    citas.find(
      (c) =>
        c.fecha === fecha &&
        c.mascotaId === Number(mascotaId) &&
        (!citaEditando || c.id !== citaEditando.id)
    ) || null
  );
}

/* ---------- Llenado de listas desplegables ---------- */

function llenarDuenos() {
  const ordenados = [...duenos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  ordenados.forEach((d) => campos.dueno.appendChild(crearOpcion(d.id, `${d.nombre} (${d.rut})`)));
}

function llenarMascotas() {
  const duenoId = campos.dueno.value;
  campos.mascota.innerHTML = "";

  if (!duenoId) {
    campos.mascota.appendChild(crearOpcion("", "Primero elige el dueño"));
    campos.mascota.disabled = true;
    return;
  }

  const delDueno = mascotas.filter((m) => m.duenoId === Number(duenoId));
  if (delDueno.length === 0) {
    campos.mascota.appendChild(crearOpcion("", "Este dueño no tiene mascotas registradas"));
    campos.mascota.disabled = true;
    return;
  }

  campos.mascota.appendChild(crearOpcion("", "Selecciona una mascota"));
  delDueno.forEach((m) =>
    campos.mascota.appendChild(crearOpcion(m.id, `${m.nombre} · ${m.especie}`))
  );
  campos.mascota.disabled = false;

  // si tiene una sola mascota, la dejamos elegida
  if (delDueno.length === 1) campos.mascota.value = delDueno[0].id;
}

function bloquearHoras(texto) {
  campos.hora.innerHTML = "";
  campos.hora.appendChild(crearOpcion("", texto));
  campos.hora.disabled = true;
}

async function llenarHoras() {
  const fecha = campos.fecha.value;
  const horaElegida = campos.hora.value;
  const ayuda = document.getElementById("ayuda-hora");
  const pedido = ++pedidoHoras;
  horarios = [];
  ayuda.textContent = "";

  if (!fecha || !esFechaNoPasada(fecha) || fecha > fechaMaxima() || !esDiaHabil(fecha)) {
    bloquearHoras("Primero elige una fecha válida");
    return;
  }

  bloquearHoras("Cargando horarios...");
  let respuesta;
  try {
    const excluir = citaEditando ? `&excluir=${citaEditando.id}` : "";
    respuesta = await api("GET", `/citas/horarios?fecha=${fecha}${excluir}`);
  } catch (error) {
    if (pedido !== pedidoHoras) return;
    bloquearHoras("No se pudieron cargar los horarios");
    mostrarMensaje(error.message, "error");
    return;
  }
  if (pedido !== pedidoHoras) return;

  horarios = respuesta;
  campos.hora.innerHTML = "";
  campos.hora.appendChild(crearOpcion("", "Selecciona una hora"));
  horarios.forEach((h) => {
    const texto = h.disponible ? h.hora : `${h.hora} · ${h.motivo}`;
    campos.hora.appendChild(crearOpcion(h.hora, texto, !h.disponible));
  });
  campos.hora.disabled = false;

  // si la hora elegida sigue libre, no la perdemos
  if (horarios.some((h) => h.hora === horaElegida && h.disponible)) campos.hora.value = horaElegida;

  const disponibles = horarios.filter((h) => h.disponible).length;
  ayuda.textContent =
    disponibles === 0
      ? "No quedan horarios disponibles este día."
      : `${disponibles} ${disponibles === 1 ? "horario disponible" : "horarios disponibles"}.`;
}

function llenarMotivos() {
  MOTIVOS.forEach((motivo) => campos.motivo.appendChild(crearOpcion(motivo, motivo)));
}

/* ---------- Validaciones ---------- */

// "" si está bien. El servidor igual vuelve a revisar todo
function validarCampo(nombre) {
  const valor = campos[nombre].value.trim();

  switch (nombre) {
    case "dueno":
      return esRequerido(valor) ? "" : "Selecciona el dueño.";

    case "mascota":
      return esRequerido(valor) ? "" : "Selecciona la mascota.";

    case "fecha": {
      if (!esRequerido(valor)) return "Elige una fecha.";
      if (!esFechaNoPasada(valor)) return "La fecha no puede ser anterior a hoy.";
      if (valor > fechaMaxima()) return `Solo se puede agendar hasta el ${formatearFecha(fechaMaxima())}.`;
      if (!esDiaHabil(valor)) return "La clínica no atiende los domingos.";
      if (campos.mascota.value) {
        const otra = citaDeMascotaEseDia(campos.mascota.value, valor);
        if (otra) {
          const mascota = buscarMascota(campos.mascota.value);
          return `${mascota.nombre} ya tiene una cita pendiente ese día a las ${otra.hora}.`;
        }
      }
      return "";
    }

    case "hora": {
      if (!esRequerido(valor)) return "Elige una hora.";
      if (!esHoraEnHorario(valor)) return `Fuera del horario de atención (${HORARIO_APERTURA} a ${HORARIO_CIERRE}).`;
      const horario = horarios.find((h) => h.hora === valor);
      if (!horario) return "Elige una de las horas de la lista.";
      if (horario.motivo === "ocupado") return "Ese horario ya fue tomado. Elige otro.";
      if (horario.motivo === "ya pasó") return "Esa hora ya pasó.";
      return "";
    }

    case "motivo":
      return esRequerido(valor) ? "" : "Selecciona el motivo de la consulta.";

    case "motivoOtro":
      if (campos.motivo.value !== "Otro") return "";
      if (!esRequerido(valor)) return "Describe brevemente el motivo.";
      if (valor.length < 3) return "Escribe al menos 3 caracteres.";
      return "";

    case "observaciones":
      return valor.length <= MAX_OBSERVACIONES ? "" : `Máximo ${MAX_OBSERVACIONES} caracteres.`;

    default:
      return "";
  }
}

function aplicarValidacion(nombre) {
  const mensaje = validarCampo(nombre);
  if (mensaje) mostrarErrorCampo(campos[nombre], mensaje);
  else limpiarErrorCampo(campos[nombre]);
  return mensaje === "";
}

/* ---------- Interacción ---------- */

function actualizarContador() {
  const largo = campos.observaciones.value.length;
  const contador = document.getElementById("contador-observaciones");
  contador.textContent = `${largo} / ${MAX_OBSERVACIONES}`;
  contador.classList.toggle("contador-limite", largo >= MAX_OBSERVACIONES - 20);
}

function mostrarCampoMotivoOtro() {
  const esOtro = campos.motivo.value === "Otro";
  document.getElementById("grupo-motivo-otro").classList.toggle("d-none", !esOtro);
  campos.motivoOtro.required = esOtro;
  if (!esOtro) {
    campos.motivoOtro.value = "";
    limpiarErrorCampo(campos.motivoOtro);
  }
}

function iniciarEventos() {
  campos.dueno.addEventListener("change", () => {
    llenarMascotas();
    limpiarErrorCampo(campos.mascota);
    aplicarValidacion("dueno");
  });

  campos.mascota.addEventListener("change", () => {
    aplicarValidacion("mascota");
    // cambiar de mascota puede crear o quitar un choque de fecha
    if (campos.fecha.value) aplicarValidacion("fecha");
  });

  campos.fecha.addEventListener("change", async () => {
    aplicarValidacion("fecha");
    await llenarHoras();
    if (campos.hora.value) aplicarValidacion("hora");
  });

  campos.hora.addEventListener("change", () => aplicarValidacion("hora"));

  campos.motivo.addEventListener("change", () => {
    mostrarCampoMotivoOtro();
    aplicarValidacion("motivo");
    if (campos.motivo.value === "Otro") campos.motivoOtro.focus();
  });

  campos.observaciones.addEventListener("input", actualizarContador);

  Object.keys(campos).forEach((nombre) => {
    campos[nombre].addEventListener("blur", () => {
      if (campos[nombre].classList.contains("is-invalid") || campos[nombre].value) {
        aplicarValidacion(nombre);
      }
    });
  });

  document.getElementById("form-cita").addEventListener("submit", guardarCita);
}

/* ---------- Guardar ---------- */

async function guardarCita(evento) {
  evento.preventDefault();
  const boton = document.getElementById("btn-guardar");
  if (boton.disabled) return;

  // por si alguien tomó la hora mientras llenaban el formulario
  const horaElegida = campos.hora.value;
  if (campos.fecha.value) await llenarHoras();

  // map y no some, para que marque todos los errores de una
  const resultados = Object.keys(campos).map(aplicarValidacion);
  if (horaElegida && !campos.hora.value) {
    mostrarErrorCampo(campos.hora, `La hora ${horaElegida} se acaba de ocupar. Elige otra.`);
  }
  if (resultados.includes(false)) {
    const primerError = document.querySelector("#form-cita .is-invalid");
    if (primerError) primerError.focus();
    mostrarMensaje("Revisa los campos marcados en rojo.", "error");
    return;
  }

  const datos = {
    mascotaId: Number(campos.mascota.value),
    fecha: campos.fecha.value,
    hora: campos.hora.value,
    motivo: campos.motivo.value === "Otro" ? campos.motivoOtro.value.trim() : campos.motivo.value,
    observaciones: campos.observaciones.value.trim(),
  };

  // así no se agenda dos veces con doble clic
  boton.disabled = true;
  try {
    const cita = citaEditando
      ? await api("PUT", `/citas/${citaEditando.id}`, datos)
      : await api("POST", "/citas", datos);
    mostrarConfirmacion(cita, Boolean(citaEditando));
  } catch (error) {
    // 409: otra persona tomó la hora, refrescamos la lista
    if (error.estado === 409 && error.errores.hora) await llenarHoras();
    mostrarErroresServidor(error, {
      mascotaId: campos.mascota,
      fecha: campos.fecha,
      hora: campos.hora,
      motivo: campos.motivo.value === "Otro" ? campos.motivoOtro : campos.motivo,
      observaciones: campos.observaciones,
    });
  } finally {
    boton.disabled = false;
  }
}

function mostrarConfirmacion(cita, fueEditada) {
  const mascota = buscarMascota(cita.mascotaId);
  const dueno = duenos.find((d) => d.id === mascota.duenoId);

  document.getElementById("confirmacion-titulo").textContent = fueEditada
    ? "¡Cita actualizada!"
    : "¡Cita agendada!";
  document.getElementById("confirmacion-texto").textContent = fueEditada
    ? `Guardamos los cambios de la cita de ${mascota.nombre}.`
    : `Te esperamos con ${mascota.nombre}. Estos son los datos de la cita:`;

  const filas = [
    ["Mascota", `${mascota.nombre} (${mascota.especie})`],
    ["Dueño", dueno ? dueno.nombre : "—"],
    ["Fecha", formatearFechaLarga(cita.fecha)],
    ["Hora", `${cita.hora} hrs`],
    ["Motivo", cita.motivo],
  ];
  if (cita.observaciones) filas.push(["Observaciones", cita.observaciones]);

  document.getElementById("confirmacion-resumen").innerHTML = filas
    .map(([dato, valor]) => `<div><dt>${dato}</dt><dd>${escaparHTML(valor)}</dd></div>`)
    .join("");

  document.getElementById("seccion-formulario").classList.add("d-none");
  document.getElementById("seccion-ayuda").classList.add("d-none");
  document.getElementById("seccion-confirmacion").classList.remove("d-none");

  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("confirmacion-titulo").focus({ preventScroll: true });
}

/* ---------- Modo edición y valores iniciales ---------- */

function mostrarAviso(texto) {
  document.getElementById("aviso-texto").textContent = texto;
  document.getElementById("seccion-formulario").classList.add("d-none");
  document.getElementById("seccion-ayuda").classList.add("d-none");
  document.getElementById("seccion-aviso").classList.remove("d-none");
}

function elegirMascota(mascotaId) {
  const mascota = buscarMascota(mascotaId);
  if (!mascota) return;
  campos.dueno.value = mascota.duenoId;
  llenarMascotas();
  campos.mascota.value = mascota.id;
}

async function cargarCitaParaEditar(id) {
  let cita;
  try {
    cita = await api("GET", `/citas/${id}`);
  } catch (error) {
    if (error.estado === 404) {
      mostrarAviso("No encontramos la cita que quieres modificar. Puede que se haya eliminado.");
    } else {
      mostrarAviso(error.message);
    }
    return;
  }
  if (cita.estado !== "pendiente") {
    mostrarAviso(`Esta cita está ${cita.estado}. Solo las citas pendientes se pueden modificar.`);
    return;
  }

  citaEditando = cita;
  document.title = "Modificar cita | VetCitas";
  document.getElementById("titulo-pagina").textContent = "Modificar cita";
  document.getElementById("subtitulo-pagina").textContent = "Cambia los datos que necesites y guarda.";
  document.querySelector("#btn-guardar span").textContent = "Guardar cambios";

  elegirMascota(cita.mascotaId);
  campos.fecha.value = cita.fecha;
  await llenarHoras();
  campos.hora.value = cita.hora;

  if (MOTIVOS.includes(cita.motivo)) {
    campos.motivo.value = cita.motivo;
  } else {
    // si el motivo se escribió a mano, va en "Otro"
    campos.motivo.value = "Otro";
    mostrarCampoMotivoOtro();
    campos.motivoOtro.value = cita.motivo;
  }

  campos.observaciones.value = cita.observaciones || "";
  actualizarContador();

  // si la fecha ya pasó hay que cambiarla para poder guardar
  if (!esFechaNoPasada(cita.fecha)) {
    aplicarValidacion("fecha");
    mostrarMensaje("Esta cita quedó con una fecha pasada. Elige una nueva fecha.", "info", 6000);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // calendario: desde hoy hasta 90 días
  campos.fecha.min = fechaLocalISO();
  campos.fecha.max = fechaMaxima();

  llenarMotivos();
  iniciarEventos();

  try {
    await cargarDatos();
  } catch (error) {
    mostrarAviso(error.message);
    return;
  }
  llenarDuenos();

  const idCita = obtenerParametroURL("id");
  const idMascota = obtenerParametroURL("mascota");
  if (idCita) await cargarCitaParaEditar(idCita);
  else if (idMascota) elegirMascota(idMascota);
});
