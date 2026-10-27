const { fechaRelativa } = require("../utilidades/fechas");

// Datos de ejemplo con los que parte el servidor cada vez que se enciende.
// Las fechas de las citas se calculan desde hoy para que siempre haya
// citas pasadas, de hoy y futuras.
function crearDatosIniciales() {
  return {
    duenos: [
      { id: 1, nombre: "Camila Rojas", rut: "12.345.678-5", telefono: "+56 9 8765 4321", email: "camila.rojas@mail.com" },
      { id: 2, nombre: "Diego Muñoz", rut: "15.678.234-3", telefono: "+56 9 7654 3210", email: "diego.munoz@mail.com" },
      { id: 3, nombre: "Valentina Soto", rut: "18.234.567-9", telefono: "+56 9 6543 2109", email: "vale.soto@mail.com" },
    ],

    mascotas: [
      { id: 1, nombre: "Luna", especie: "Perro", raza: "Labrador", edad: 4, duenoId: 1 },
      { id: 2, nombre: "Michi", especie: "Gato", raza: "Siamés", edad: 2, duenoId: 1 },
      { id: 3, nombre: "Rocky", especie: "Perro", raza: "Bulldog", edad: 6, duenoId: 2 },
      { id: 4, nombre: "Pelusa", especie: "Conejo", raza: "Mini Lop", edad: 1, duenoId: 3 },
    ],

    citas: [
      { id: 1, mascotaId: 1, fecha: fechaRelativa(-7), hora: "10:00", motivo: "Vacuna antirrábica", observaciones: "", estado: "atendida" },
      { id: 2, mascotaId: 3, fecha: fechaRelativa(-3), hora: "16:30", motivo: "Control de peso", observaciones: "", estado: "cancelada" },
      { id: 3, mascotaId: 2, fecha: fechaRelativa(0), hora: "11:00", motivo: "Revisión de oído", observaciones: "", estado: "pendiente" },
      { id: 4, mascotaId: 4, fecha: fechaRelativa(0), hora: "15:00", motivo: "Corte de uñas", observaciones: "", estado: "pendiente" },
      { id: 5, mascotaId: 1, fecha: fechaRelativa(2), hora: "09:30", motivo: "Control anual", observaciones: "", estado: "pendiente" },
    ],

    atenciones: [
      {
        id: 1, citaId: 1, mascotaId: 1, fecha: fechaRelativa(-7),
        diagnostico: "Paciente sano, se aplica vacuna anual.",
        tratamiento: "Reposo de 24 horas.",
        medicamentos: "Vacuna antirrábica",
      },
    ],
  };
}

module.exports = { crearDatosIniciales };
