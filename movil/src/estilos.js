import { StyleSheet } from "react-native";

// Los mismos colores de frontend/css (variables --vet-*)
export const colores = {
  azul: "#0a2640",
  azulClaro: "#1c3d5a",
  menta: "#65e4a3",
  mentaSuave: "#e3f9ee",
  texto: "#5b7075",
  borde: "#e4ecee",
  fondo: "#f7f9fa",
  blanco: "#ffffff",
  exito: "#15803d",
  exitoFondo: "#dcfce7",
  error: "#c62828",
  errorFondo: "#fde8e8",
  aviso: "#b45309",
  avisoFondo: "#fef3c7",
};

export const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 16,
    gap: 12,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colores.azul,
  },
  subtitulo: {
    fontSize: 14,
    color: colores.texto,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: "700",
    color: colores.texto,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  texto: {
    fontSize: 15,
    color: colores.azul,
  },
  boton: {
    backgroundColor: colores.azul,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonTexto: {
    color: colores.blanco,
    fontWeight: "700",
    fontSize: 15,
  },
  botonSecundario: {
    borderWidth: 1.5,
    borderColor: colores.error,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
  },
  botonSecundarioTexto: {
    color: colores.error,
    fontWeight: "700",
    fontSize: 15,
  },
  input: {
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colores.azul,
  },
  inputError: {
    borderColor: colores.error,
  },
  textoError: {
    color: colores.error,
    fontSize: 13,
    marginTop: 4,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
});
