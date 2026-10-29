// la tabla se dibuja a partir de esto
const filtros = {
  texto: "",
  estado: "todas",
  fecha: "",
  rango: "todas", // "todas" | "hoy" | "proximas" | "pasadas"
};

let citas = [];
let mascotas = [];
let duenos = [];

/* ---------- Datos ---------- */

async function cargarDatos() {
  [citas, mascotas, duenos] = await Promise.all([
    api("GET", "/citas"),
    api("GET", "/mascotas"),
    api("GET", "/duenos"),
  ]);
}

function obtenerCitasConDetalle() {
  return citas.map((cita) => {
    const mascota = mascotas.find((m) => m.id === cita.mascotaId) || null;
    const dueno = mascota ? duenos.find((d) => d.id === mascota.duenoId) || null : null;
    return { ...cita, mascota, dueno };
  });
}

function cumpleFiltros(cita) {
  const hoy = fechaLocalISO();

  if (filtros.texto) {
    const nombres = normalizar(`${cita.mascota?.nombre} ${cita.dueno?.nombre}`);
    if (!nombres.includes(normalizar(filtros.texto))) return false;
  }
  if (filtros.estado !== "todas" && cita.estado !== filtros.estado) return false;
  if (filtros.fecha && cita.fecha !== filtros.fecha) return false;

  if (filtros.rango === "hoy" && cita.fecha !== hoy) return false;
  if (filtros.rango === "proximas" && cita.fecha < hoy) return false;
  if (filtros.rango === "pasadas" && cita.fecha >= hoy) return false;

  return true;
}

function estaVencida(cita) {
  return cita.estado === "pendiente" && cita.fecha < fechaLocalISO();
}

/* ---------- Dibujo de la tabla ---------- */

function filaCita(cita) {
  const mascota = cita.mascota
    ? `<a href="mascota.html?id=${cita.mascota.id}">${escaparHTML(cita.mascota.nombre)}</a>
       <small class="d-block texto-suave">${escaparHTML(cita.mascota.especie)}</small>`
    : "—";

  const vencida = estaVencida(cita)
    ? ` <span class="etiqueta-vencida" title="La fecha ya pasó y la cita sigue pendiente">Vencida</span>`
    : "";

  // solo las pendientes se pueden editar o cancelar
  const acciones =
    cita.estado === "pendiente"
      ? `<a href="nueva-cita.html?id=${cita.id}" class="btn-accion" title="Editar cita" aria-label="Editar cita de ${escaparHTML(cita.mascota?.nombre)}">
           <i class="fa-solid fa-pen"></i>
         </a>
         <button type="button" class="btn-accion btn-accion-peligro" data-accion="cancelar" data-id="${cita.id}" title="Cancelar cita" aria-label="Cancelar cita de ${escaparHTML(cita.mascota?.nombre)}">
           <i class="fa-solid fa-xmark"></i>
         </button>`
      : `<span class="texto-suave">—</span>`;

  return `
    <tr>
      <td>${formatearFecha(cita.fecha)}</td>
      <td>${cita.hora}</td>
      <td>${mascota}</td>
      <td>${cita.dueno ? escaparHTML(cita.dueno.nombre) : "—"}</td>
      <td class="celda-motivo">${escaparHTML(cita.motivo)}</td>
      <td>${etiquetaEstado(cita.estado)}${vencida}</td>
      <td class="text-end"><div class="acciones">${acciones}</div></td>
    </tr>`;
}

function mostrarCitas() {
  const todas = obtenerCitasConDetalle();
  const visibles = todas
    .filter(cumpleFiltros)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const cuerpo = document.getElementById("tabla-citas");
  if (visibles.length === 0) {
    cuerpo.innerHTML = `
      <tr>
        <td colspan="7" class="vacio">
          <i class="fa-solid fa-magnifying-glass fs-3 d-block mb-2"></i>
          No hay citas que coincidan con los filtros.
        </td>
      </tr>`;
  } else {
    cuerpo.innerHTML = visibles.map(filaCita).join("");
  }

  document.getElementById("contador-citas").textContent =
    `Mostrando ${visibles.length} de ${todas.length} ${todas.length === 1 ? "cita" : "citas"}`;
}

/* ---------- Filtros ---------- */

function marcarChipActivo(rango) {
  document.querySelectorAll("#chips-rango .chip").forEach((chip) => {
    const activo = chip.dataset.rango === rango;
    chip.classList.toggle("activo", activo);
    chip.setAttribute("aria-pressed", String(activo));
  });
}

function iniciarFiltros() {
  const formulario = document.getElementById("form-filtros");
  const inputTexto = document.getElementById("filtro-texto");
  const selectEstado = document.getElementById("filtro-estado");
  const inputFecha = document.getElementById("filtro-fecha");

  inputTexto.addEventListener("input", () => {
    filtros.texto = inputTexto.value;
    mostrarCitas();
  });

  selectEstado.addEventListener("change", () => {
    filtros.estado = selectEstado.value;
    mostrarCitas();
  });

  // una fecha exacta pisa al rango (Hoy, Próximas...)
  inputFecha.addEventListener("change", () => {
    filtros.fecha = inputFecha.value;
    filtros.rango = "todas";
    marcarChipActivo("todas");
    mostrarCitas();
  });

  document.getElementById("chips-rango").addEventListener("click", (evento) => {
    const chip = evento.target.closest(".chip");
    if (!chip) return;
    filtros.rango = chip.dataset.rango;
    filtros.fecha = "";
    inputFecha.value = "";
    marcarChipActivo(filtros.rango);
    mostrarCitas();
  });

  // el reset limpia los inputs, pero el objeto filtros hay que limpiarlo a mano
  formulario.addEventListener("reset", () => {
    Object.assign(filtros, { texto: "", estado: "todas", fecha: "", rango: "todas" });
    marcarChipActivo("todas");
    // esperamos a que el navegador vacíe los campos
    setTimeout(mostrarCitas);
  });

  formulario.addEventListener("submit", (evento) => evento.preventDefault());

  // ej: citas.html?estado=pendiente
  const estadoURL = obtenerParametroURL("estado");
  if (ESTADOS_CITA.includes(estadoURL)) {
    filtros.estado = estadoURL;
    selectEstado.value = estadoURL;
  }
}

/* ---------- Cancelar cita ---------- */

function iniciarAcciones() {
  // delegación de eventos: un solo listener para todas las filas
  document.getElementById("tabla-citas").addEventListener("click", async (evento) => {
    const boton = evento.target.closest('[data-accion="cancelar"]');
    if (!boton) return;

    const cita = citas.find((c) => c.id === Number(boton.dataset.id));
    if (!cita || cita.estado !== "pendiente") {
      mostrarMensaje("Esta cita ya no se puede cancelar.", "error");
      mostrarCitas();
      return;
    }

    const mascota = mascotas.find((m) => m.id === cita.mascotaId);
    const nombre = mascota ? mascota.nombre : "la mascota";
    const confirmado = await confirmarAccion(
      `¿Cancelar la cita de ${nombre} del ${formatearFecha(cita.fecha)} a las ${cita.hora}? Esta acción no se puede deshacer.`,
      "Sí, cancelar"
    );
    if (!confirmado) return;

    try {
      const cancelada = await api("PATCH", `/citas/${cita.id}/cancelar`);
      citas = citas.map((c) => (c.id === cancelada.id ? cancelada : c));
      mostrarCitas();
      mostrarMensaje(`La cita de ${nombre} fue cancelada.`, "exito");
    } catch (error) {
      mostrarErroresServidor(error);
      // la cambiaron desde otra pestaña, recargamos
      if (error.estado === 404 || error.estado === 409) {
        await cargarDatos();
        mostrarCitas();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  iniciarFiltros();
  iniciarAcciones();
  try {
    await cargarDatos();
  } catch (error) {
    mostrarErroresServidor(error);
  }
  mostrarCitas();
});
