import { api } from "./api";

// La API devuelve la cita con mascotaId y la mascota con duenoId. Para mostrar
// nombres pedimos las tres listas a la vez y las juntamos aquí, igual que la web.
export async function cargarCitasConNombres(filtros = "") {
  const [citas, mascotas, duenos] = await Promise.all([
    api("GET", `/citas${filtros}`),
    api("GET", "/mascotas"),
    api("GET", "/duenos"),
  ]);
  return citas.map((cita) => {
    const mascota = mascotas.find((m) => m.id === cita.mascotaId);
    const dueno = mascota && duenos.find((d) => d.id === mascota.duenoId);
    return { ...cita, mascota, dueno };
  });
}

// las más próximas primero, y dentro del día por hora
export function ordenarPorFecha(citas) {
  return [...citas].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
}

export async function cargarMascotasConDueno() {
  const [mascotas, duenos] = await Promise.all([api("GET", "/mascotas"), api("GET", "/duenos")]);
  return mascotas
    .map((mascota) => ({ ...mascota, dueno: duenos.find((d) => d.id === mascota.duenoId) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}
