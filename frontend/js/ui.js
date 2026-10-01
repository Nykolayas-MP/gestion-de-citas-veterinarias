/* ---------- Mensajes / alertas ---------- */

// Muestra un mensaje en el contenedor #mensajes de la página.
// tipo: "exito" | "error" | "info"
function mostrarMensaje(texto, tipo = "info", duracionMs = 4000) {
  const contenedor = document.getElementById("mensajes");
  if (!contenedor) return;

  const alerta = document.createElement("div");
  alerta.className = `mensaje mensaje-${tipo}`;
  alerta.setAttribute("role", tipo === "error" ? "alert" : "status");

  const contenido = document.createElement("span");
  contenido.className = "mensaje-texto";
  contenido.textContent = texto;
  alerta.appendChild(contenido);

  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.className = "mensaje-cerrar";
  cerrar.setAttribute("aria-label", "Cerrar mensaje");
  cerrar.textContent = "×";
  cerrar.addEventListener("click", () => alerta.remove());
  alerta.appendChild(cerrar);

  contenedor.appendChild(alerta);
  if (duracionMs > 0) setTimeout(() => alerta.remove(), duracionMs);
}

// Guarda un mensaje para mostrarlo en la siguiente página
// (por ejemplo, después de guardar un formulario y redirigir).
function mensajeParaSiguientePagina(texto, tipo = "exito") {
  sessionStorage.setItem("vet_mensaje", JSON.stringify({ texto, tipo }));
}

function mostrarMensajePendiente() {
  const guardado = sessionStorage.getItem("vet_mensaje");
  if (!guardado) return;
  sessionStorage.removeItem("vet_mensaje");
  const { texto, tipo } = JSON.parse(guardado);
  mostrarMensaje(texto, tipo);
}

/* ---------- Errores en formularios ---------- */

// Marca un campo como inválido y muestra el texto de error bajo él.
// Usa las clases de Bootstrap "is-invalid" e "invalid-feedback".
function mostrarErrorCampo(campo, texto) {
  campo.classList.add("is-invalid");
  campo.setAttribute("aria-invalid", "true");

  let error = campo.parentElement.querySelector(".invalid-feedback");
  if (!error) {
    error = document.createElement("small");
    error.className = "invalid-feedback";
    campo.parentElement.appendChild(error);
  }
  error.textContent = texto;
}

function limpiarErrorCampo(campo) {
  campo.classList.remove("is-invalid");
  campo.removeAttribute("aria-invalid");
  const error = campo.parentElement.querySelector(".invalid-feedback");
  if (error) error.remove();
}

function limpiarErroresFormulario(formulario) {
  formulario.querySelectorAll(".is-invalid").forEach(limpiarErrorCampo);
}

// Crea un <option> para llenar listas desplegables desde JavaScript.
function crearOpcion(valor, texto, deshabilitada = false) {
  const opcion = document.createElement("option");
  opcion.value = valor;
  opcion.textContent = texto;
  opcion.disabled = deshabilitada;
  return opcion;
}

/* ---------- Modal de confirmación ---------- */

// Abre un modal y devuelve una Promise que resuelve true (Aceptar) o false (Cancelar).
// Uso:  if (await confirmarAccion("¿Cancelar la cita?")) { ... }
function confirmarAccion(mensaje, textoAceptar = "Aceptar") {
  return new Promise((resolver) => {
    const fondo = document.createElement("div");
    fondo.className = "modal-vet-fondo";
    fondo.innerHTML = `
      <div class="modal-vet" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <span class="modal-vet-icono"><i class="fa-solid fa-triangle-exclamation"></i></span>
        <h2 id="modal-titulo" class="modal-vet-titulo">Confirmar acción</h2>
        <p class="modal-vet-texto mb-0"></p>
        <div class="modal-vet-acciones">
          <button type="button" class="btn btn-outline-dark" data-respuesta="no">Volver</button>
          <button type="button" class="btn btn-danger" data-respuesta="si"></button>
        </div>
      </div>`;
    fondo.querySelector(".modal-vet-texto").textContent = mensaje;
    fondo.querySelector('[data-respuesta="si"]').textContent = textoAceptar;

    function cerrar(respuesta) {
      document.removeEventListener("keydown", alPresionarTecla);
      fondo.remove();
      resolver(respuesta);
    }
    function alPresionarTecla(evento) {
      if (evento.key === "Escape") cerrar(false);
    }

    fondo.addEventListener("click", (evento) => {
      if (evento.target === fondo) cerrar(false);
      const boton = evento.target.closest("[data-respuesta]");
      if (boton) cerrar(boton.dataset.respuesta === "si");
    });
    document.addEventListener("keydown", alPresionarTecla);

    document.body.appendChild(fondo);
    fondo.querySelector('[data-respuesta="si"]').focus();
  });
}

/* ---------- Formato ---------- */

// "2026-09-29" -> "29-09-2026"
function formatearFecha(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}-${mes}-${anio}`;
}

// "2026-10-01" -> "Jueves, 1 de octubre de 2026"
function formatearFechaLarga(fechaISO) {
  const texto = new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Devuelve el HTML de la etiqueta de color según el estado de la cita.
function etiquetaEstado(estado) {
  const texto = estado.charAt(0).toUpperCase() + estado.slice(1);
  return `<span class="estado estado-${estado}">${texto}</span>`;
}

// Escapa texto ingresado por el usuario antes de insertarlo con innerHTML.
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = String(texto ?? "");
  return div.innerHTML;
}

// Quita tildes y pasa a minúsculas para comparar textos sin importar cómo se escribieron.
// Ej: normalizar("Muñoz") -> "munoz"
function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Pone en mayúscula la primera letra de cada palabra. Ej: "ana pérez" -> "Ana Pérez"
function capitalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

// 0 -> "Menos de 1 año", 1 -> "1 año", 4 -> "4 años"
function textoEdad(edad) {
  if (Number(edad) === 0) return "Menos de 1 año";
  return `${edad} ${Number(edad) === 1 ? "año" : "años"}`;
}

// Lee un parámetro de la URL. Ej: mascota.html?id=3 -> obtenerParametroURL("id") = "3"
function obtenerParametroURL(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
}

/* ---------- Menú de navegación ---------- */

// El botón hamburguesa lo maneja Bootstrap (data-bs-toggle="collapse").
function iniciarMenu() {
  // Marca como activo el enlace de la página actual.
  // mascota.html (detalle) se considera parte de "Mascotas".
  let paginaActual = window.location.pathname.split("/").pop() || "index.html";
  if (paginaActual === "mascota.html") paginaActual = "mascotas.html";

  document.querySelectorAll(".navbar-vet .nav-link").forEach((enlace) => {
    if (enlace.getAttribute("href") === paginaActual) {
      enlace.classList.add("active");
      enlace.setAttribute("aria-current", "page");
    }
  });

  // Año actual en el pie de página.
  const anio = document.getElementById("anio-actual");
  if (anio) anio.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarMenu();
  mostrarMensajePendiente();
});
