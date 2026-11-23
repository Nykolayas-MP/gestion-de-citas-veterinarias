const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// toISOString() usa UTC y a veces da el día equivocado, por eso la hora local
export function fechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function aDate(iso) {
  return new Date(`${iso}T00:00:00`);
}

// "2026-11-13" → "13-11-2026", como en la web
export function fechaCorta(iso) {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}-${mes}-${anio}`;
}

// "2026-11-13" → "Viernes, 13 de noviembre de 2026"
export function fechaLarga(iso) {
  const fecha = aDate(iso);
  const dia = DIAS[fecha.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

const ULTIMA_HORA = "18:30";

function horaActual() {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
}

// los próximos días en que atiende la clínica (sin domingos). Si ya pasó la última
// hora del día, parte desde mañana para no mostrar un día sin horas libres.
export function proximosDiasHabiles(cantidad) {
  const dias = [];
  const fecha = new Date();
  if (horaActual() >= ULTIMA_HORA) fecha.setDate(fecha.getDate() + 1);
  while (dias.length < cantidad) {
    if (fecha.getDay() !== 0) {
      dias.push({
        iso: fechaLocalISO(fecha),
        nombre: DIAS_CORTOS[fecha.getDay()],
        numero: fecha.getDate(),
        mes: MESES[fecha.getMonth()].slice(0, 3),
      });
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  return dias;
}
