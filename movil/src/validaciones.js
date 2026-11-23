// Las mismas reglas de backend/validaciones.js. Se revisan antes de enviar
// para no crear un dueño nuevo si los datos de la mascota vienen mal.

export const EDAD_MAXIMA = 30;

export function esTextoValido(valor) {
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]{2,}$/.test(valor.trim());
}

export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// +56 9 1234 5678, con o sin espacios
export function esTelefonoValido(telefono) {
  return /^\+?56\s?9\s?\d{4}\s?\d{4}$/.test(telefono.trim());
}

export function esEdadValida(edad) {
  if (edad.trim() === "") return false;
  const numero = Number(edad);
  return Number.isInteger(numero) && numero >= 0 && numero <= EDAD_MAXIMA;
}

export function limpiarRut(rut) {
  return rut.trim().replace(/\./g, "").replace(/-/g, "").toUpperCase();
}

// RUT con dígito verificador (módulo 11)
export function esRutValido(rut) {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return limpio.slice(-1) === dv;
}

// "12345678k" → "12.345.678-K", como lo guarda la web
export function formatearRut(rut) {
  const limpio = limpiarRut(rut);
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
}

// "56912345678" → "+56 9 1234 5678"
export function formatearTelefono(telefono) {
  const numeros = telefono.replace(/\D/g, "").slice(-9);
  return `+56 ${numeros.slice(0, 1)} ${numeros.slice(1, 5)} ${numeros.slice(5)}`;
}

// "max  POWER" → "Max Power"
export function capitalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}
