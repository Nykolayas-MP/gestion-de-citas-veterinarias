function mostrarFechaHoy() {
  const texto = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  document.getElementById("fecha-hoy").textContent =
    texto.charAt(0).toUpperCase() + texto.slice(1);
}

document.addEventListener("DOMContentLoaded", () => {
  mostrarFechaHoy();
});
