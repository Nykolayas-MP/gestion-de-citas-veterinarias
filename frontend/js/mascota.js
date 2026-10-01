/* =========================================================
   mascota.js — Ficha de una mascota (mascota.html?id=N)
   ---------------------------------------------------------
   Muestra los datos de la mascota y de su dueño, el historial
   clínico y sus citas. Permite registrar la atención de una
   cita, editar los datos de la mascota y eliminarla.
   ========================================================= */

const EDAD_MAXIMA = 30;
const MIN_CARACTERES_ATENCION = 5;
const CAMPOS_EDICION = ["nombre", "especie", "raza", "edad"];
const CAMPOS_ATENCION = ["diagnostico", "tratamiento", "medicamentos"];

// Mascota que se muestra en la ficha.
let mascota = null;

// Cita a la que se le está registrando la atención (null si el formulario está cerrado).
let citaAtendiendo = null;

// Referencias a los campos de los formularios de edición y de atención.
const campos = {
  nombre: document.getElementById("nombre"),
  especie: document.getElementById("especie"),
  raza: document.getElementById("raza"),
  edad: document.getElementById("edad"),
  diagnostico: document.getElementById("diagnostico"),
  tratamiento: document.getElementById("tratamiento"),
  medicamentos: document.getElementById("medicamentos"),
};

/* ---------- Utilidades ---------- */

// Quita tildes y pasa a minúsculas para comparar textos sin importar cómo se escribieron.
function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Pone en mayúscula la primera letra de cada palabra.
function capitalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

function textoEdad(edad) {
  if (Number(edad) === 0) return "Menos de 1 año";
  return `${edad} ${Number(edad) === 1 ? "año" : "años"}`;
}

// Solo se registra la atención de una cita pendiente cuya fecha ya llegó.
function puedeAtenderse(cita) {
  return cita.estado === "pendiente" && cita.fecha <= fechaLocalISO();
}

/* ---------- Datos de la mascota y del dueño ---------- */

function mostrarDatos() {
  const dueno = obtenerDuenoPorId(mascota.duenoId);

  document.title = `${mascota.nombre} | VetCitas`;
  document.getElementById("titulo-pagina").textContent = mascota.nombre;
  document.getElementById("subtitulo-pagina").textContent = `${mascota.especie} · ${mascota.raza}`;
  document.getElementById("btn-agendar").href = `nueva-cita.html?mascota=${mascota.id}`;

  document.getElementById("dato-nombre").textContent = mascota.nombre;
  document.getElementById("dato-especie").textContent = mascota.especie;
  document.getElementById("dato-raza").textContent = mascota.raza;
  document.getElementById("dato-edad").textContent = textoEdad(mascota.edad);

  document.getElementById("dueno-nombre").textContent = dueno ? dueno.nombre : "—";
  document.getElementById("dueno-rut").textContent = dueno ? dueno.rut : "—";
  document.getElementById("dueno-telefono").textContent = dueno ? dueno.telefono : "—";
  document.getElementById("dueno-email").textContent = dueno ? dueno.email : "—";
}

/* ---------- Historial clínico ---------- */

function tarjetaAtencion(atencion) {
  const cita = obtenerCitaPorId(atencion.citaId);
  const medicamentos = atencion.medicamentos ? escaparHTML(atencion.medicamentos) : "Sin medicamentos";

  return `
    <article class="tarjeta-vet atencion">
      <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <h3 class="atencion-titulo">${cita ? escaparHTML(cita.motivo) : "Atención"}</h3>
        <span class="texto-suave">${formatearFecha(atencion.fecha)}</span>
      </div>
      <dl class="atencion-datos mb-0">
        <dt>Diagnóstico</dt>
        <dd>${escaparHTML(atencion.diagnostico)}</dd>
        <dt>Tratamiento</dt>
        <dd>${escaparHTML(atencion.tratamiento)}</dd>
        <dt>Medicamentos</dt>
        <dd>${medicamentos}</dd>
      </dl>
    </article>`;
}

function mostrarHistorial() {
  const atenciones = obtenerAtencionesPorMascota(mascota.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const lista = document.getElementById("lista-atenciones");

  if (atenciones.length === 0) {
    lista.innerHTML = `
      <div class="tarjeta-vet vacio">
        <i class="fa-solid fa-notes-medical fs-3 d-block mb-2"></i>
        Aún no hay atenciones registradas.
      </div>`;
  } else {
    lista.innerHTML = atenciones.map(tarjetaAtencion).join("");
  }
}

/* ---------- Citas ---------- */

function filaCita(cita) {
  const accion = puedeAtenderse(cita)
    ? `<button type="button" class="btn btn-sm btn-success text-dark" data-accion="atender" data-id="${cita.id}">
         <i class="fa-solid fa-stethoscope me-1"></i>Registrar atención
       </button>`
    : `<span class="texto-suave">—</span>`;

  return `
    <tr>
      <td>${formatearFecha(cita.fecha)}</td>
      <td>${cita.hora}</td>
      <td class="celda-motivo">${escaparHTML(cita.motivo)}</td>
      <td>${etiquetaEstado(cita.estado)}</td>
      <td class="text-end">${accion}</td>
    </tr>`;
}

function mostrarCitas() {
  const citas = obtenerCitasPorMascota(mascota.id)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const cuerpo = document.getElementById("tabla-citas");

  if (citas.length === 0) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="5" class="vacio">
          <i class="fa-solid fa-calendar-xmark fs-3 d-block mb-2"></i>
          Esta mascota todavía no tiene citas.
        </td>
      </tr>`;
  } else {
    cuerpo.innerHTML = citas.map(filaCita).join("");
  }
}

/* ---------- Validaciones ---------- */

// Devuelve el mensaje de error del campo, o "" si es válido.
function validarCampo(nombre) {
  const valor = campos[nombre].value.trim();

  switch (nombre) {
    case "nombre": {
      if (!esRequerido(valor)) return "Escribe el nombre de la mascota.";
      if (!esTextoValido(valor)) return "El nombre solo puede tener letras y espacios.";
      const repetida = obtenerMascotasPorDueno(mascota.duenoId).some(
        (m) => m.id !== mascota.id && normalizar(m.nombre) === normalizar(valor)
      );
      if (repetida) return "El dueño ya tiene otra mascota con ese nombre.";
      return "";
    }

    case "especie":
      return esRequerido(valor) ? "" : "Selecciona la especie.";

    case "raza":
      if (!esRequerido(valor)) return "Escribe la raza (o \"Mestizo\").";
      if (!esTextoValido(valor)) return "La raza solo puede tener letras y espacios.";
      return "";

    case "edad":
      if (!esRequerido(valor)) return "Escribe la edad.";
      if (!esNumeroEnRango(valor, 0, EDAD_MAXIMA)) return `La edad debe ser un número entero entre 0 y ${EDAD_MAXIMA}.`;
      return "";

    case "diagnostico":
      if (!esRequerido(valor)) return "Escribe el diagnóstico.";
      if (valor.length < MIN_CARACTERES_ATENCION) return `Escribe al menos ${MIN_CARACTERES_ATENCION} caracteres.`;
      return "";

    case "tratamiento":
      if (!esRequerido(valor)) return "Escribe el tratamiento.";
      if (valor.length < MIN_CARACTERES_ATENCION) return `Escribe al menos ${MIN_CARACTERES_ATENCION} caracteres.`;
      return "";

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

// Valida una lista de campos y enfoca el primero con error. Devuelve true si todos son válidos.
function validarFormulario(nombres, formulario) {
  // map, no some, para marcar todos los errores a la vez.
  const resultados = nombres.map(aplicarValidacion);
  if (!resultados.includes(false)) return true;

  const primerError = formulario.querySelector(".is-invalid");
  if (primerError) primerError.focus();
  mostrarMensaje("Revisa los campos marcados en rojo.", "error");
  return false;
}

/* ---------- Registrar atención ---------- */

function abrirAtencion(citaId) {
  const cita = obtenerCitaPorId(citaId);
  if (!cita || !puedeAtenderse(cita)) {
    mostrarMensaje("A esta cita ya no se le puede registrar una atención.", "error");
    mostrarCitas();
    return;
  }

  cerrarEdicion();
  citaAtendiendo = cita;
  document.getElementById("atencion-cita").textContent =
    `Cita del ${formatearFecha(cita.fecha)} a las ${cita.hora} · ${cita.motivo}`;

  const formulario = document.getElementById("form-atencion");
  formulario.classList.remove("d-none");
  formulario.scrollIntoView({ behavior: "smooth" });
  campos.diagnostico.focus({ preventScroll: true });
}

function cerrarAtencion() {
  const formulario = document.getElementById("form-atencion");
  citaAtendiendo = null;
  formulario.reset();
  limpiarErroresFormulario(formulario);
  formulario.classList.add("d-none");
}

function guardarAtencion(evento) {
  evento.preventDefault();
  if (!validarFormulario(CAMPOS_ATENCION, evento.target)) return;

  // crearAtencion (data.js) también marca la cita como "atendida".
  crearAtencion({
    citaId: citaAtendiendo.id,
    mascotaId: mascota.id,
    fecha: citaAtendiendo.fecha,
    diagnostico: campos.diagnostico.value.trim(),
    tratamiento: campos.tratamiento.value.trim(),
    medicamentos: campos.medicamentos.value.trim(),
  });

  cerrarAtencion();
  mostrarHistorial();
  mostrarCitas();
  mostrarMensaje("Atención registrada. La cita quedó como atendida.", "exito");
}

/* ---------- Editar y eliminar ---------- */

function abrirEdicion() {
  cerrarAtencion();
  campos.nombre.value = mascota.nombre;
  campos.especie.value = mascota.especie;
  campos.raza.value = mascota.raza;
  campos.edad.value = mascota.edad;

  const formulario = document.getElementById("form-editar");
  formulario.classList.remove("d-none");
  formulario.scrollIntoView({ behavior: "smooth" });
  campos.nombre.focus({ preventScroll: true });
}

function cerrarEdicion() {
  const formulario = document.getElementById("form-editar");
  limpiarErroresFormulario(formulario);
  formulario.classList.add("d-none");
}

function guardarEdicion(evento) {
  evento.preventDefault();
  if (!validarFormulario(CAMPOS_EDICION, evento.target)) return;

  mascota = actualizarMascota(mascota.id, {
    nombre: capitalizar(campos.nombre.value),
    especie: campos.especie.value,
    raza: capitalizar(campos.raza.value),
    edad: Number(campos.edad.value),
  });

  cerrarEdicion();
  mostrarDatos();
  mostrarMensaje("Los datos de la mascota se actualizaron.", "exito");
}

async function confirmarEliminacion() {
  const confirmado = await confirmarAccion(
    `¿Eliminar a ${mascota.nombre}? También se borrarán sus citas y su historial clínico. Esta acción no se puede deshacer.`,
    "Sí, eliminar"
  );
  if (!confirmado) return;

  eliminarMascota(mascota.id);
  mensajeParaSiguientePagina(`Se eliminó a ${mascota.nombre} del sistema.`);
  window.location.href = "mascotas.html";
}

/* ---------- Interacción ---------- */

function iniciarEventos() {
  document.getElementById("btn-editar").addEventListener("click", abrirEdicion);
  document.getElementById("btn-cancelar-edicion").addEventListener("click", cerrarEdicion);
  document.getElementById("form-editar").addEventListener("submit", guardarEdicion);

  document.getElementById("btn-eliminar").addEventListener("click", confirmarEliminacion);

  // Un solo listener en la tabla atiende los botones de todas las filas.
  document.getElementById("tabla-citas").addEventListener("click", (evento) => {
    const boton = evento.target.closest('[data-accion="atender"]');
    if (boton) abrirAtencion(boton.dataset.id);
  });
  document.getElementById("btn-cancelar-atencion").addEventListener("click", cerrarAtencion);
  document.getElementById("form-atencion").addEventListener("submit", guardarAtencion);

  // Al salir de un campo con error, se vuelve a revisar.
  Object.keys(campos).forEach((nombre) => {
    campos[nombre].addEventListener("blur", () => {
      if (campos[nombre].classList.contains("is-invalid") || campos[nombre].value) {
        aplicarValidacion(nombre);
      }
    });
  });
}

function mostrarAviso() {
  document.getElementById("seccion-ficha").classList.add("d-none");
  document.getElementById("seccion-aviso").classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
  mascota = obtenerMascotaPorId(obtenerParametroURL("id"));
  if (!mascota) {
    mostrarAviso();
    return;
  }

  iniciarEventos();
  mostrarDatos();
  mostrarHistorial();
  mostrarCitas();
});
