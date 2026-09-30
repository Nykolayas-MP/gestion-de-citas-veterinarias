/* =========================================================
   validaciones.js — Funciones de validación reutilizables
   ---------------------------------------------------------
   Cada función recibe un valor y devuelve true / false.
   Se usan en los formularios de todos los módulos.
   ========================================================= */

const HORARIO_APERTURA = "09:00";
const HORARIO_CIERRE = "19:00";

function esRequerido(valor) {
  return String(valor ?? "").trim() !== "";
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// Celular chileno: +56 9 1234 5678 (espacios opcionales).
function esTelefonoValido(telefono) {
  return /^\+?56\s?9\s?\d{4}\s?\d{4}$/.test(telefono.trim());
}

// Solo letras (incluye tildes y ñ), espacios y guiones. Mínimo 2 caracteres.
function esTextoValido(texto) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]{2,}$/.test(texto.trim());
}

function esNumeroEnRango(valor, min, max) {
  const numero = Number(valor);
  return valor !== "" && Number.isInteger(numero) && numero >= min && numero <= max;
}

// RUT chileno con dígito verificador (módulo 11). Acepta "12.345.678-5" o "12345678-5".
function esRutValido(rut) {
  const limpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dvCalculado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);

  return dvIngresado === dvCalculado;
}

// La fecha ("YYYY-MM-DD") es hoy o posterior.
function esFechaNoPasada(fecha) {
  return fecha >= fechaLocalISO();
}

// La clínica atiende de lunes a sábado. getDay() devuelve 0 para domingo.
function esDiaHabil(fecha) {
  return new Date(`${fecha}T00:00:00`).getDay() !== 0;
}

// La hora ("HH:MM") está dentro del horario de atención de la clínica.
function esHoraEnHorario(hora) {
  return hora >= HORARIO_APERTURA && hora < HORARIO_CIERRE;
}
