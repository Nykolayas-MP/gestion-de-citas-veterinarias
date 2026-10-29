const { fechaLocalISO, fechaRelativa } = require("./utilidades/fechas");

// Las mismas reglas del frontend. Se repiten porque cualquiera puede
// saltarse el formulario y llamar a la API directo.

const HORARIO_APERTURA = "09:00";
const HORARIO_CIERRE = "19:00";
const EDAD_MAXIMA = 30;
const MAX_DIAS_ANTICIPACION = 90;
const ESTADOS_CITA = ["pendiente", "atendida", "cancelada"];

function texto(valor) {
  return typeof valor === "string" || typeof valor === "number" ? String(valor).trim() : "";
}

function esRequerido(valor) {
  return texto(valor) !== "";
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(email));
}

// +56 9 1234 5678, con o sin espacios
function esTelefonoValido(telefono) {
  return /^\+?56\s?9\s?\d{4}\s?\d{4}$/.test(texto(telefono));
}

function esTextoValido(valor) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]{2,}$/.test(texto(valor));
}

function esNumeroEnRango(valor, min, max) {
  if (texto(valor) === "") return false;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= min && numero <= max;
}

// RUT con dígito verificador (módulo 11)
function esRutValido(rut) {
  const limpio = texto(rut).replace(/\./g, "").replace(/-/g, "").toUpperCase();
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

// también revisa que la fecha exista: 2026-02-30 no pasa
function esFechaValida(fecha) {
  const valor = texto(fecha);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fechaReal = new Date(`${valor}T00:00:00`);
  return !Number.isNaN(fechaReal.getTime()) && fechaLocalISO(fechaReal) === valor;
}

function esHoraValida(hora) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(texto(hora));
}

function esFechaNoPasada(fecha) {
  return texto(fecha) >= fechaLocalISO();
}

function esFechaDentroDelLimite(fecha) {
  return texto(fecha) <= fechaRelativa(MAX_DIAS_ANTICIPACION);
}

// getDay() da 0 para el domingo
function esDiaHabil(fecha) {
  return new Date(`${texto(fecha)}T00:00:00`).getDay() !== 0;
}

function esHoraEnHorario(hora) {
  const valor = texto(hora);
  return valor >= HORARIO_APERTURA && valor < HORARIO_CIERRE;
}

module.exports = {
  HORARIO_APERTURA,
  HORARIO_CIERRE,
  EDAD_MAXIMA,
  MAX_DIAS_ANTICIPACION,
  ESTADOS_CITA,
  texto,
  esRequerido,
  esEmailValido,
  esTelefonoValido,
  esTextoValido,
  esNumeroEnRango,
  esRutValido,
  esFechaValida,
  esHoraValida,
  esFechaNoPasada,
  esFechaDentroDelLimite,
  esDiaHabil,
  esHoraEnHorario,
};
