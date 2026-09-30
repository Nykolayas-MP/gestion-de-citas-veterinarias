/* =========================================================
   nueva-cita.js — Formulario para agendar o modificar citas
   ---------------------------------------------------------
   nueva-cita.html            -> agenda una cita nueva
   nueva-cita.html?id=3       -> modifica la cita 3
   nueva-cita.html?mascota=2  -> agenda con la mascota 2 ya elegida
   ========================================================= */

const MOTIVOS = [
  "Consulta general",
  "Vacunación",
  "Control",
  "Desparasitación",
  "Cirugía",
  "Urgencia",
  "Otro",
];
const DURACION_CITA_MINUTOS = 30;
const MAX_DIAS_ANTICIPACION = 90;
const MAX_OBSERVACIONES = 200;

// Cita que se está modificando (null cuando se agenda una nueva).
let citaEditando = null;

// Referencias a los campos del formulario.
const campos = {
  dueno: document.getElementById("dueno"),
  mascota: document.getElementById("mascota"),
  fecha: document.getElementById("fecha"),
  hora: document.getElementById("hora"),
  motivo: document.getElementById("motivo"),
  motivoOtro: document.getElementById("motivo-otro"),
  observaciones: document.getElementById("observaciones"),
};

/* ---------- Utilidades de tiempo ---------- */

function aMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function aHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// Todos los bloques de la jornada: 09:00, 09:30, ..., 18:30
function generarHorarios() {
  const horarios = [];
  const inicio = aMinutos(HORARIO_APERTURA);
  const fin = aMinutos(HORARIO_CIERRE);
  for (let minutos = inicio; minutos < fin; minutos += DURACION_CITA_MINUTOS) {
    horarios.push(aHora(minutos));
  }
  return horarios;
}

function horaActual() {
  const ahora = new Date();
  return aHora(ahora.getHours() * 60 + ahora.getMinutes());
}

function fechaMaxima() {
  return fechaRelativa(MAX_DIAS_ANTICIPACION);
}

/* ---------- Reglas de negocio ---------- */

// Citas que bloquean un horario: todas menos las canceladas
// y menos la que se está modificando.
function citasActivasDelDia(fecha) {
  return obtenerCitas().filter(
    (c) =>
      c.fecha === fecha &&
      c.estado !== "cancelada" &&
      (!citaEditando || c.id !== citaEditando.id)
  );
}

function horasOcupadas(fecha) {
  return citasActivasDelDia(fecha).map((c) => c.hora);
}

function esHoraPasada(fecha, hora) {
  return fecha === fechaLocalISO() && hora <= horaActual();
}

// Otra cita pendiente de la misma mascota ese día (o null).
function citaDeMascotaEseDia(mascotaId, fecha) {
  return (
    citasActivasDelDia(fecha).find(
      (c) => c.mascotaId === Number(mascotaId) && c.estado === "pendiente"
    ) || null
  );
}

/* ---------- Llenado de listas desplegables ---------- */

function crearOpcion(valor, texto, deshabilitada = false) {
  const opcion = document.createElement("option");
  opcion.value = valor;
  opcion.textContent = texto;
  opcion.disabled = deshabilitada;
  return opcion;
}

function llenarDuenos() {
  const duenos = obtenerDuenos().sort((a, b) => a.nombre.localeCompare(b.nombre));
  duenos.forEach((d) => campos.dueno.appendChild(crearOpcion(d.id, `${d.nombre} (${d.rut})`)));
}

function llenarMascotas() {
  const duenoId = campos.dueno.value;
  campos.mascota.innerHTML = "";

  if (!duenoId) {
    campos.mascota.appendChild(crearOpcion("", "Primero elige el dueño"));
    campos.mascota.disabled = true;
    return;
  }

  const mascotas = obtenerMascotasPorDueno(duenoId);
  if (mascotas.length === 0) {
    campos.mascota.appendChild(crearOpcion("", "Este dueño no tiene mascotas registradas"));
    campos.mascota.disabled = true;
    return;
  }

  campos.mascota.appendChild(crearOpcion("", "Selecciona una mascota"));
  mascotas.forEach((m) =>
    campos.mascota.appendChild(crearOpcion(m.id, `${m.nombre} · ${m.especie}`))
  );
  campos.mascota.disabled = false;

  // Si el dueño tiene una sola mascota, se elige automáticamente.
  if (mascotas.length === 1) campos.mascota.value = mascotas[0].id;
}

function llenarHoras() {
  const fecha = campos.fecha.value;
  const horaElegida = campos.hora.value;
  const ayuda = document.getElementById("ayuda-hora");
  campos.hora.innerHTML = "";

  // Sin fecha válida no tiene sentido mostrar horarios.
  if (!fecha || !esFechaNoPasada(fecha) || !esDiaHabil(fecha)) {
    campos.hora.appendChild(crearOpcion("", "Primero elige una fecha válida"));
    campos.hora.disabled = true;
    ayuda.textContent = "";
    return;
  }

  const ocupadas = horasOcupadas(fecha);
  let disponibles = 0;

  campos.hora.appendChild(crearOpcion("", "Selecciona una hora"));
  generarHorarios().forEach((hora) => {
    let texto = hora;
    let deshabilitada = false;
    if (ocupadas.includes(hora)) {
      texto += " · ocupado";
      deshabilitada = true;
    } else if (esHoraPasada(fecha, hora)) {
      texto += " · ya pasó";
      deshabilitada = true;
    } else {
      disponibles++;
    }
    campos.hora.appendChild(crearOpcion(hora, texto, deshabilitada));
  });

  campos.hora.disabled = false;
  // Mantiene la hora elegida si sigue disponible en la nueva fecha.
  const opcionPrevia = [...campos.hora.options].find((o) => o.value === horaElegida && !o.disabled);
  if (opcionPrevia) campos.hora.value = horaElegida;

  ayuda.textContent =
    disponibles === 0
      ? "No quedan horarios disponibles este día."
      : `${disponibles} ${disponibles === 1 ? "horario disponible" : "horarios disponibles"}.`;
}

function llenarMotivos() {
  MOTIVOS.forEach((motivo) => campos.motivo.appendChild(crearOpcion(motivo, motivo)));
}

/* ---------- Validaciones ---------- */

// Devuelve el mensaje de error del campo, o "" si es válido.
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
          const mascota = obtenerMascotaPorId(campos.mascota.value);
          return `${mascota.nombre} ya tiene una cita pendiente ese día a las ${otra.hora}.`;
        }
      }
      return "";
    }

    case "hora": {
      if (!esRequerido(valor)) return "Elige una hora.";
      if (!esHoraEnHorario(valor)) return `Fuera del horario de atención (${HORARIO_APERTURA} a ${HORARIO_CIERRE}).`;
      const fecha = campos.fecha.value;
      if (horasOcupadas(fecha).includes(valor)) return "Ese horario ya fue tomado. Elige otro.";
      if (esHoraPasada(fecha, valor)) return "Esa hora ya pasó.";
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

// Valida un campo y muestra u oculta su mensaje de error. Devuelve true si es válido.
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
    // Cambiar de mascota puede resolver (o crear) un choque de fecha.
    if (campos.fecha.value) aplicarValidacion("fecha");
  });

  campos.fecha.addEventListener("change", () => {
    llenarHoras();
    aplicarValidacion("fecha");
    if (campos.hora.value) aplicarValidacion("hora");
  });

  campos.hora.addEventListener("change", () => aplicarValidacion("hora"));

  campos.motivo.addEventListener("change", () => {
    mostrarCampoMotivoOtro();
    aplicarValidacion("motivo");
    if (campos.motivo.value === "Otro") campos.motivoOtro.focus();
  });

  campos.observaciones.addEventListener("input", actualizarContador);

  // Al salir de un campo con error, se vuelve a revisar.
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

function guardarCita(evento) {
  evento.preventDefault();

  // Se vuelve a llenar la lista de horas por si otra pestaña tomó un horario.
  if (campos.fecha.value) llenarHoras();

  // Se validan todos los campos (map, no some, para marcar todos los errores a la vez).
  const resultados = Object.keys(campos).map(aplicarValidacion);
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

  const cita = citaEditando ? actualizarCita(citaEditando.id, datos) : crearCita(datos);
  mostrarConfirmacion(cita, Boolean(citaEditando));
}

function mostrarConfirmacion(cita, fueEditada) {
  const mascota = obtenerMascotaPorId(cita.mascotaId);
  const dueno = obtenerDuenoPorId(mascota.duenoId);

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
  const mascota = obtenerMascotaPorId(mascotaId);
  if (!mascota) return;
  campos.dueno.value = mascota.duenoId;
  llenarMascotas();
  campos.mascota.value = mascota.id;
}

function cargarCitaParaEditar(id) {
  const cita = obtenerCitaPorId(id);
  if (!cita) {
    mostrarAviso("No encontramos la cita que quieres modificar. Puede que se haya eliminado.");
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
  llenarHoras();
  campos.hora.value = cita.hora;

  if (MOTIVOS.includes(cita.motivo)) {
    campos.motivo.value = cita.motivo;
  } else {
    // Motivos escritos a mano se muestran en "Otro".
    campos.motivo.value = "Otro";
    mostrarCampoMotivoOtro();
    campos.motivoOtro.value = cita.motivo;
  }

  campos.observaciones.value = cita.observaciones || "";
  actualizarContador();

  // Una cita pendiente con fecha pasada debe cambiar de fecha para guardarse.
  if (!esFechaNoPasada(cita.fecha)) {
    aplicarValidacion("fecha");
    mostrarMensaje("Esta cita quedó con una fecha pasada. Elige una nueva fecha.", "info", 6000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Límites del calendario: desde hoy hasta 90 días más.
  campos.fecha.min = fechaLocalISO();
  campos.fecha.max = fechaMaxima();

  llenarDuenos();
  llenarMotivos();
  iniciarEventos();

  const idCita = obtenerParametroURL("id");
  const idMascota = obtenerParametroURL("mascota");
  if (idCita) cargarCitaParaEditar(idCita);
  else if (idMascota) elegirMascota(idMascota);
});
