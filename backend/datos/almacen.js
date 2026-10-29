const { crearDatosIniciales } = require("./datos-iniciales");

// Todo vive en memoria: al reiniciar el servidor vuelven los datos de ejemplo.
// En el Taller 3 esto se cambia por la base de datos.
let datos = crearDatosIniciales();

// Siempre devolvemos copias, así un sort() en una ruta no desordena la lista real
function copiar(item) {
  return item ? { ...item } : null;
}

function coleccion(nombre) {
  if (!datos[nombre]) throw new Error(`La colección "${nombre}" no existe.`);
  return datos[nombre];
}

// ej: listar("citas", (c) => c.estado === "pendiente")
function listar(nombre, condicion = () => true) {
  return coleccion(nombre).filter(condicion).map(copiar);
}

function buscarPorId(nombre, id) {
  return copiar(coleccion(nombre).find((item) => item.id === Number(id)));
}

function insertar(nombre, item) {
  const lista = coleccion(nombre);
  const id = lista.reduce((max, actual) => Math.max(max, actual.id), 0) + 1;
  const nuevo = { ...item, id };
  lista.push(nuevo);
  return copiar(nuevo);
}

// cambia solo los campos que vienen
function actualizar(nombre, id, cambios) {
  const lista = coleccion(nombre);
  const indice = lista.findIndex((item) => item.id === Number(id));
  if (indice === -1) return null;
  lista[indice] = { ...lista[indice], ...cambios, id: Number(id) };
  return copiar(lista[indice]);
}

function eliminar(nombre, id) {
  const lista = coleccion(nombre);
  const indice = lista.findIndex((item) => item.id === Number(id));
  if (indice === -1) return false;
  lista.splice(indice, 1);
  return true;
}

// ej: eliminarDonde("citas", (c) => c.mascotaId === 3)
function eliminarDonde(nombre, condicion) {
  const antes = coleccion(nombre).length;
  datos[nombre] = coleccion(nombre).filter((item) => !condicion(item));
  return antes - datos[nombre].length;
}

function reiniciar() {
  datos = crearDatosIniciales();
}

module.exports = { listar, buscarPorId, insertar, actualizar, eliminar, eliminarDonde, reiniciar };
