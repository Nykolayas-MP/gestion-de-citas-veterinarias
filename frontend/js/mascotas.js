/* =========================================================
   mascotas.js — Listado y registro de mascotas (mascotas.html)
   ---------------------------------------------------------
   Muestra todas las mascotas con su dueño, permite buscarlas
   y registrar una mascota nueva con un dueño existente o nuevo.
   ========================================================= */

const EDAD_MAXIMA = 30;
const CAMPOS_DUENO_NUEVO = ["duenoNombre", "duenoRut", "duenoTelefono", "duenoEmail"];

// Referencias a los campos del formulario.
const campos = {
  dueno: document.getElementById("dueno"),
  duenoNombre: document.getElementById("dueno-nombre"),
  duenoRut: document.getElementById("dueno-rut"),
  duenoTelefono: document.getElementById("dueno-telefono"),
  duenoEmail: document.getElementById("dueno-email"),
  nombre: document.getElementById("nombre"),
  especie: document.getElementById("especie"),
  raza: document.getElementById("raza"),
  edad: document.getElementById("edad"),
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

// Deja el RUT sin puntos ni guion, para comparar RUT escritos con distinto formato.
function limpiarRut(rut) {
  return rut.trim().replace(/\./g, "").replace(/-/g, "").toUpperCase();
}

// Da al RUT el formato con puntos y guion que usa el sistema.
function formatearRut(rut) {
  const limpio = limpiarRut(rut);
  const cuerpo = Number(limpio.slice(0, -1)).toLocaleString("es-CL");
  return `${cuerpo}-${limpio.slice(-1)}`;
}

// Da al teléfono el formato con espacios que usa el sistema.
function formatearTelefono(telefono) {
  const numeros = telefono.replace(/\D/g, "").slice(-9);
  return `+56 ${numeros.slice(0, 1)} ${numeros.slice(1, 5)} ${numeros.slice(5)}`;
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

function rutRepetido(rut) {
  return obtenerDuenos().some((d) => limpiarRut(d.rut) === limpiarRut(rut));
}

function textoEdad(edad) {
  if (Number(edad) === 0) return "Menos de 1 año";
  return `${edad} ${Number(edad) === 1 ? "año" : "años"}`;
}

function esDuenoNuevo() {
  return document.getElementById("dueno-nuevo").checked;
}

function crearOpcion(valor, texto) {
  const opcion = document.createElement("option");
  opcion.value = valor;
  opcion.textContent = texto;
  return opcion;
}

/* ---------- Listado ---------- */

// Une cada mascota con su dueño para no buscarlo varias veces.
function obtenerMascotasConDueno() {
  return obtenerMascotas().map((mascota) => {
    const dueno = obtenerDuenoPorId(mascota.duenoId);
    return { ...mascota, dueno };
  });
}

// Busca por nombre de la mascota, nombre del dueño o RUT (con o sin puntos).
function cumpleBusqueda(mascota, texto) {
  const dueno = mascota.dueno;
  const datos = dueno
    ? `${mascota.nombre} ${dueno.nombre} ${dueno.rut} ${limpiarRut(dueno.rut)}`
    : mascota.nombre;
  return normalizar(datos).includes(normalizar(texto));
}

function filaMascota(mascota) {
  const dueno = mascota.dueno;
  const celdaDueno = dueno
    ? `${escaparHTML(dueno.nombre)}
       <small class="d-block texto-suave">${escaparHTML(dueno.rut)}</small>`
    : "—";

  return `
    <tr>
      <td>
        <a href="mascota.html?id=${mascota.id}">${escaparHTML(mascota.nombre)}</a>
        <small class="d-block texto-suave">${escaparHTML(mascota.especie)}</small>
      </td>
      <td>${escaparHTML(mascota.raza)}</td>
      <td>${textoEdad(mascota.edad)}</td>
      <td>${celdaDueno}</td>
      <td>${dueno ? escaparHTML(dueno.telefono) : "—"}</td>
      <td class="text-end">
        <div class="acciones">
          <a href="mascota.html?id=${mascota.id}" class="btn-accion" title="Ver ficha" aria-label="Ver ficha de ${escaparHTML(mascota.nombre)}">
            <i class="fa-solid fa-file-medical"></i>
          </a>
        </div>
      </td>
    </tr>`;
}

function mostrarMascotas() {
  const texto = document.getElementById("buscar-texto").value;
  const todas = obtenerMascotasConDueno();
  const visibles = todas
    .filter((mascota) => cumpleBusqueda(mascota, texto))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const cuerpo = document.getElementById("tabla-mascotas");
  if (visibles.length === 0) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="6" class="vacio">
          <i class="fa-solid fa-magnifying-glass fs-3 d-block mb-2"></i>
          No hay mascotas que coincidan con la búsqueda.
        </td>
      </tr>`;
  } else {
    cuerpo.innerHTML = visibles.map(filaMascota).join("");
  }

  document.getElementById("contador-mascotas").textContent =
    `Mostrando ${visibles.length} de ${todas.length} ${todas.length === 1 ? "mascota" : "mascotas"}`;
}

/* ---------- Formulario ---------- */

function llenarDuenos() {
  campos.dueno.innerHTML = "";
  campos.dueno.appendChild(crearOpcion("", "Selecciona un dueño"));
  const duenos = obtenerDuenos().sort((a, b) => a.nombre.localeCompare(b.nombre));
  duenos.forEach((d) => campos.dueno.appendChild(crearOpcion(d.id, `${d.nombre} (${d.rut})`)));
}

// Muestra los campos del dueño registrado o los del dueño nuevo.
function mostrarGrupoDueno() {
  const nuevo = esDuenoNuevo();
  document.getElementById("grupo-dueno-existente").classList.toggle("d-none", nuevo);
  document.getElementById("grupo-dueno-nuevo").classList.toggle("d-none", !nuevo);

  limpiarErrorCampo(campos.dueno);
  CAMPOS_DUENO_NUEVO.forEach((nombre) => limpiarErrorCampo(campos[nombre]));
}

/* ---------- Validaciones ---------- */

// Devuelve el mensaje de error del campo, o "" si es válido.
function validarCampo(nombre) {
  const valor = campos[nombre].value.trim();

  // Solo se revisan los campos del dueño que están a la vista.
  if (nombre === "dueno" && esDuenoNuevo()) return "";
  if (CAMPOS_DUENO_NUEVO.includes(nombre) && !esDuenoNuevo()) return "";

  switch (nombre) {
    case "dueno":
      return esRequerido(valor) ? "" : "Selecciona el dueño.";

    case "duenoNombre":
      if (!esRequerido(valor)) return "Escribe el nombre del dueño.";
      if (!esTextoValido(valor)) return "El nombre solo puede tener letras y espacios.";
      return "";

    case "duenoRut":
      if (!esRequerido(valor)) return "Escribe el RUT del dueño.";
      if (!esRutValido(valor)) return "El RUT no es válido. Revisa el dígito verificador.";
      if (rutRepetido(valor)) return "Ya existe un dueño con este RUT. Elígelo en \"Dueño registrado\".";
      return "";

    case "duenoTelefono":
      if (!esRequerido(valor)) return "Escribe el teléfono del dueño.";
      if (!esTelefonoValido(valor)) return "Usa el formato +56 9 1234 5678.";
      return "";

    case "duenoEmail":
      if (!esRequerido(valor)) return "Escribe el correo del dueño.";
      if (!esEmailValido(valor)) return "El correo no tiene un formato válido.";
      return "";

    case "nombre": {
      if (!esRequerido(valor)) return "Escribe el nombre de la mascota.";
      if (!esTextoValido(valor)) return "El nombre solo puede tener letras y espacios.";
      if (!esDuenoNuevo() && campos.dueno.value) {
        const repetida = obtenerMascotasPorDueno(campos.dueno.value).some(
          (m) => normalizar(m.nombre) === normalizar(valor)
        );
        if (repetida) return "Este dueño ya tiene una mascota con ese nombre.";
      }
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

function iniciarEventos() {
  const formulario = document.getElementById("form-mascota");

  // El listado se filtra mientras se escribe.
  document.getElementById("buscar-texto").addEventListener("input", mostrarMascotas);

  // Evita que Enter en el buscador recargue la página.
  document.getElementById("form-buscar").addEventListener("submit", (evento) => evento.preventDefault());

  document.getElementById("dueno-existente").addEventListener("change", mostrarGrupoDueno);
  document.getElementById("dueno-nuevo").addEventListener("change", mostrarGrupoDueno);

  // Al salir de un campo con error, se vuelve a revisar.
  Object.keys(campos).forEach((nombre) => {
    campos[nombre].addEventListener("blur", () => {
      if (campos[nombre].classList.contains("is-invalid") || campos[nombre].value) {
        aplicarValidacion(nombre);
      }
    });
  });

  // El botón "Limpiar" vacía los campos; aquí se quitan los errores.
  formulario.addEventListener("reset", () => {
    limpiarErroresFormulario(formulario);
    // Se espera a que el navegador vuelva a marcar "Dueño registrado".
    setTimeout(mostrarGrupoDueno);
  });

  formulario.addEventListener("submit", guardarMascota);
}

/* ---------- Guardar ---------- */

function guardarMascota(evento) {
  evento.preventDefault();

  // Se validan todos los campos (map, no some, para marcar todos los errores a la vez).
  const resultados = Object.keys(campos).map(aplicarValidacion);
  if (resultados.includes(false)) {
    const primerError = document.querySelector("#form-mascota .is-invalid");
    if (primerError) primerError.focus();
    mostrarMensaje("Revisa los campos marcados en rojo.", "error");
    return;
  }

  let duenoId = Number(campos.dueno.value);
  if (esDuenoNuevo()) {
    const dueno = crearDueno({
      nombre: capitalizar(campos.duenoNombre.value),
      rut: formatearRut(campos.duenoRut.value),
      telefono: formatearTelefono(campos.duenoTelefono.value),
      email: campos.duenoEmail.value.trim().toLowerCase(),
    });
    duenoId = dueno.id;
    llenarDuenos();
  }

  const mascota = crearMascota({
    nombre: capitalizar(campos.nombre.value),
    especie: campos.especie.value,
    raza: capitalizar(campos.raza.value),
    edad: Number(campos.edad.value),
    duenoId: duenoId,
  });

  document.getElementById("form-mascota").reset();
  mostrarMascotas();
  mostrarMensaje(`Se registró a ${mascota.nombre} correctamente.`, "exito");
}

document.addEventListener("DOMContentLoaded", () => {
  llenarDuenos();
  iniciarEventos();
  mostrarMascotas();
});
