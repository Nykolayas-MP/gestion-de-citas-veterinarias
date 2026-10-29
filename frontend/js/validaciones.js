const HORARIO_APERTURA = "09:00";
const HORARIO_CIERRE = "19:00";
const EDAD_MAXIMA = 30; // años, para el registro de mascotas

function esRequerido(valor) {
  return String(valor ?? "").trim() !== "";
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// +56 9 1234 5678, con o sin espacios
function esTelefonoValido(telefono) {
  return /^\+?56\s?9\s?\d{4}\s?\d{4}$/.test(telefono.trim());
}

function esTextoValido(texto) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]{2,}$/.test(texto.trim());
}

function esNumeroEnRango(valor, min, max) {
  const numero = Number(valor);
  return valor !== "" && Number.isInteger(numero) && numero >= min && numero <= max;
}

// RUT con dígito verificador (módulo 11)
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

function esFechaNoPasada(fecha) {
  return fecha >= fechaLocalISO();
}

// getDay() da 0 para el domingo
function esDiaHabil(fecha) {
  return new Date(`${fecha}T00:00:00`).getDay() !== 0;
}

function esHoraEnHorario(hora) {
  return hora >= HORARIO_APERTURA && hora < HORARIO_CIERRE;
}
