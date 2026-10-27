const { crearDatosIniciales } = require("./datos-iniciales");

// Los datos viven en memoria mientras el servidor está encendido.
// Al apagarlo se pierden y al encenderlo se vuelve a los datos de ejemplo.
// En el Taller 3 estas funciones se cambian por consultas a la base de datos.
let datos = crearDatosIniciales();

// Las funciones devuelven COPIAS de los datos. Así una ruta no puede
// modificar la lista por accidente (por ejemplo, al ordenarla con sort).
function copiar(item) {
  return item ? { ...item } : null;
}

function coleccion(nombre) {
  if (!datos[nombre]) throw new Error(`La colección "${nombre}" no existe.`);
  return datos[nombre];
}

// Todos los elementos. Opcionalmente filtrados: listar("citas", (c) => c.estado === "pendiente")
function listar(nombre, condicion = () => true) {
  return coleccion(nombre).filter(condicion).map(copiar);
}

function buscarPorId(nombre, id) {
  return copiar(coleccion(nombre).find((item) => item.id === Number(id)));
}

// Agrega un elemento con el siguiente id disponible y lo devuelve.
function insertar(nombre, item) {
  const lista = coleccion(nombre);
  const id = lista.reduce((max, actual) => Math.max(max, actual.id), 0) + 1;
  const nuevo = { ...item, id };
  lista.push(nuevo);
  return copiar(nuevo);
}

// Cambia solo los campos indicados. Devuelve el elemento actualizado o null si no existe.
function actualizar(nombre, id, cambios) {
  const lista = coleccion(nombre);
  const indice = lista.findIndex((item) => item.id === Number(id));
  if (indice === -1) return null;
  lista[indice] = { ...lista[indice], ...cambios, id: Number(id) };
  return copiar(lista[indice]);
}

// Devuelve true si eliminó el elemento.
function eliminar(nombre, id) {
  const lista = coleccion(nombre);
  const indice = lista.findIndex((item) => item.id === Number(id));
  if (indice === -1) return false;
  lista.splice(indice, 1);
  return true;
}

// Elimina todos los elementos que cumplen la condición. Devuelve cuántos eliminó.
// Ej: eliminarDonde("citas", (c) => c.mascotaId === 3)
function eliminarDonde(nombre, condicion) {
  const antes = coleccion(nombre).length;
  datos[nombre] = coleccion(nombre).filter((item) => !condicion(item));
  return antes - datos[nombre].length;
}

// Vuelve a los datos de ejemplo.
function reiniciar() {
  datos = crearDatosIniciales();
}

module.exports = { listar, buscarPorId, insertar, actualizar, eliminar, eliminarDonde, reiniciar };
