/* =========================================================
   data.js — Capa de datos del sistema
   ---------------------------------------------------------
   Todas las páginas leen y guardan información SOLO a través
   de las funciones de este archivo.

   Taller 1: los datos se guardan en localStorage.
   Taller 2: se reemplaza el interior de estas funciones por
             llamadas fetch() al backend, sin tocar el resto
             del código.

   Modelo de datos:
     Dueño    { id, nombre, rut, telefono, email }
     Mascota  { id, nombre, especie, raza, edad, duenoId }
     Cita     { id, mascotaId, fecha, hora, motivo, estado }
                estado: "pendiente" | "atendida" | "cancelada"
     Atención { id, citaId, mascotaId, fecha, diagnostico,
                tratamiento, medicamentos }
   ========================================================= */

const CLAVES = {
  duenos: "vet_duenos",
  mascotas: "vet_mascotas",
  citas: "vet_citas",
  atenciones: "vet_atenciones",
};

const ESTADOS_CITA = ["pendiente", "atendida", "cancelada"];

/* ---------- Utilidades de fecha ---------- */

// Devuelve una fecha en formato "YYYY-MM-DD" usando la hora local
// (toISOString() usa UTC y puede entregar el día equivocado).
function fechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Fecha desplazada N días desde hoy (negativo = pasado).
function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fechaLocalISO(fecha);
}

/* ---------- Lectura / escritura genérica ---------- */

function leerColeccion(clave) {
  const texto = localStorage.getItem(clave);
  return texto ? JSON.parse(texto) : [];
}

function guardarColeccion(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

// Siguiente id disponible: el mayor id existente + 1.
function generarId(coleccion) {
  return coleccion.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/* ---------- Datos de ejemplo ---------- */

function cargarDatosIniciales() {
  if (localStorage.getItem(CLAVES.duenos)) return; // ya existen datos

  guardarColeccion(CLAVES.duenos, [
    { id: 1, nombre: "Camila Rojas", rut: "12.345.678-5", telefono: "+56 9 8765 4321", email: "camila.rojas@mail.com" },
    { id: 2, nombre: "Diego Muñoz", rut: "15.678.234-3", telefono: "+56 9 7654 3210", email: "diego.munoz@mail.com" },
    { id: 3, nombre: "Valentina Soto", rut: "18.234.567-9", telefono: "+56 9 6543 2109", email: "vale.soto@mail.com" },
  ]);

  guardarColeccion(CLAVES.mascotas, [
    { id: 1, nombre: "Luna", especie: "Perro", raza: "Labrador", edad: 4, duenoId: 1 },
    { id: 2, nombre: "Michi", especie: "Gato", raza: "Siamés", edad: 2, duenoId: 1 },
    { id: 3, nombre: "Rocky", especie: "Perro", raza: "Bulldog", edad: 6, duenoId: 2 },
    { id: 4, nombre: "Pelusa", especie: "Conejo", raza: "Mini Lop", edad: 1, duenoId: 3 },
  ]);

  guardarColeccion(CLAVES.citas, [
    { id: 1, mascotaId: 1, fecha: fechaRelativa(-7), hora: "10:00", motivo: "Vacuna antirrábica", estado: "atendida" },
    { id: 2, mascotaId: 3, fecha: fechaRelativa(-3), hora: "16:30", motivo: "Control de peso", estado: "cancelada" },
    { id: 3, mascotaId: 2, fecha: fechaRelativa(0), hora: "11:00", motivo: "Revisión de oído", estado: "pendiente" },
    { id: 4, mascotaId: 4, fecha: fechaRelativa(0), hora: "15:00", motivo: "Corte de uñas", estado: "pendiente" },
    { id: 5, mascotaId: 1, fecha: fechaRelativa(2), hora: "09:30", motivo: "Control anual", estado: "pendiente" },
  ]);

  guardarColeccion(CLAVES.atenciones, [
    {
      id: 1, citaId: 1, mascotaId: 1, fecha: fechaRelativa(-7),
      diagnostico: "Paciente sano, se aplica vacuna anual.",
      tratamiento: "Reposo de 24 horas.",
      medicamentos: "Vacuna antirrábica",
    },
  ]);
}

// Borra todo y vuelve a los datos de ejemplo (útil para pruebas).
function reiniciarDatos() {
  Object.values(CLAVES).forEach((clave) => localStorage.removeItem(clave));
  cargarDatosIniciales();
}

/* ---------- Dueños ---------- */

function obtenerDuenos() {
  return leerColeccion(CLAVES.duenos);
}

function obtenerDuenoPorId(id) {
  return obtenerDuenos().find((d) => d.id === Number(id)) || null;
}

function crearDueno(datos) {
  const duenos = obtenerDuenos();
  const nuevo = { ...datos, id: generarId(duenos) };
  duenos.push(nuevo);
  guardarColeccion(CLAVES.duenos, duenos);
  return nuevo;
}

function actualizarDueno(id, cambios) {
  const duenos = obtenerDuenos();
  const indice = duenos.findIndex((d) => d.id === Number(id));
  if (indice === -1) return null;
  duenos[indice] = { ...duenos[indice], ...cambios, id: Number(id) };
  guardarColeccion(CLAVES.duenos, duenos);
  return duenos[indice];
}

/* ---------- Mascotas ---------- */

function obtenerMascotas() {
  return leerColeccion(CLAVES.mascotas);
}

function obtenerMascotaPorId(id) {
  return obtenerMascotas().find((m) => m.id === Number(id)) || null;
}

function obtenerMascotasPorDueno(duenoId) {
  return obtenerMascotas().filter((m) => m.duenoId === Number(duenoId));
}

function crearMascota(datos) {
  const mascotas = obtenerMascotas();
  const nueva = { ...datos, id: generarId(mascotas), duenoId: Number(datos.duenoId) };
  mascotas.push(nueva);
  guardarColeccion(CLAVES.mascotas, mascotas);
  return nueva;
}

function actualizarMascota(id, cambios) {
  const mascotas = obtenerMascotas();
  const indice = mascotas.findIndex((m) => m.id === Number(id));
  if (indice === -1) return null;
  mascotas[indice] = { ...mascotas[indice], ...cambios, id: Number(id) };
  guardarColeccion(CLAVES.mascotas, mascotas);
  return mascotas[indice];
}

// Elimina la mascota junto con sus citas y atenciones.
function eliminarMascota(id) {
  const mascotaId = Number(id);
  guardarColeccion(CLAVES.mascotas, obtenerMascotas().filter((m) => m.id !== mascotaId));
  guardarColeccion(CLAVES.citas, obtenerCitas().filter((c) => c.mascotaId !== mascotaId));
  guardarColeccion(CLAVES.atenciones, obtenerAtenciones().filter((a) => a.mascotaId !== mascotaId));
}

/* ---------- Citas ---------- */

function obtenerCitas() {
  return leerColeccion(CLAVES.citas);
}

function obtenerCitaPorId(id) {
  return obtenerCitas().find((c) => c.id === Number(id)) || null;
}

function obtenerCitasPorMascota(mascotaId) {
  return obtenerCitas().filter((c) => c.mascotaId === Number(mascotaId));
}

function crearCita(datos) {
  const citas = obtenerCitas();
  const nueva = {
    ...datos,
    id: generarId(citas),
    mascotaId: Number(datos.mascotaId),
    estado: "pendiente",
  };
  citas.push(nueva);
  guardarColeccion(CLAVES.citas, citas);
  return nueva;
}

function actualizarCita(id, cambios) {
  const citas = obtenerCitas();
  const indice = citas.findIndex((c) => c.id === Number(id));
  if (indice === -1) return null;
  citas[indice] = { ...citas[indice], ...cambios, id: Number(id) };
  guardarColeccion(CLAVES.citas, citas);
  return citas[indice];
}

function cancelarCita(id) {
  return actualizarCita(id, { estado: "cancelada" });
}

/* ---------- Atenciones (fichas clínicas) ---------- */

function obtenerAtenciones() {
  return leerColeccion(CLAVES.atenciones);
}

function obtenerAtencionesPorMascota(mascotaId) {
  return obtenerAtenciones().filter((a) => a.mascotaId === Number(mascotaId));
}

// Registra la atención y marca la cita asociada como "atendida".
function crearAtencion(datos) {
  const atenciones = obtenerAtenciones();
  const nueva = {
    ...datos,
    id: generarId(atenciones),
    citaId: Number(datos.citaId),
    mascotaId: Number(datos.mascotaId),
  };
  atenciones.push(nueva);
  guardarColeccion(CLAVES.atenciones, atenciones);
  actualizarCita(nueva.citaId, { estado: "atendida" });
  return nueva;
}

// Se ejecuta al cargar cualquier página.
cargarDatosIniciales();
