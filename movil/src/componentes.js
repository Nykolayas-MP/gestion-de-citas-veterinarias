import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colores, estilos } from "./estilos";

const ESTADOS = {
  pendiente: { texto: "Pendiente", color: colores.aviso, fondo: colores.avisoFondo },
  atendida: { texto: "Atendida", color: colores.exito, fondo: colores.exitoFondo },
  cancelada: { texto: "Cancelada", color: colores.error, fondo: colores.errorFondo },
};

export function EstadoCita({ estado }) {
  const { texto, color, fondo } = ESTADOS[estado] || ESTADOS.pendiente;
  return (
    <View style={{ backgroundColor: fondo, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{texto}</Text>
    </View>
  );
}

export function Chip({ texto, activo, desactivado, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desactivado}
      style={{
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: activo ? colores.azul : colores.borde,
        backgroundColor: activo ? colores.azul : desactivado ? colores.fondo : colores.blanco,
        opacity: desactivado ? 0.45 : 1,
      }}
    >
      <Text style={{ color: activo ? colores.blanco : colores.azul, fontWeight: "600" }}>{texto}</Text>
    </Pressable>
  );
}

export function Cargando() {
  return (
    <View style={[estilos.pantalla, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator size="large" color={colores.azul} />
    </View>
  );
}

export function MensajeError({ mensaje, onReintentar }) {
  return (
    <View style={[estilos.pantalla, estilos.contenido, { justifyContent: "center" }]}>
      <View style={estilos.tarjeta}>
        <Text style={[estilos.titulo, { marginBottom: 6 }]}>Algo salió mal</Text>
        <Text style={estilos.subtitulo}>{mensaje}</Text>
      </View>
      {onReintentar && (
        <Pressable style={estilos.boton} onPress={onReintentar}>
          <Text style={estilos.botonTexto}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Dato({ etiqueta, valor }) {
  return (
    <View style={[estilos.fila, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colores.borde }]}>
      <Text style={estilos.subtitulo}>{etiqueta}</Text>
      <Text style={[estilos.texto, { flexShrink: 1, textAlign: "right", fontWeight: "600" }]}>{valor}</Text>
    </View>
  );
}

// Carga los datos cada vez que se entra a la pantalla. Así, si alguien registró algo
// desde la web, aparece al volver a la pantalla sin cerrar la app.
export function useDatos(cargar) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const recargar = useCallback(async () => {
    try {
      setDatos(await cargar());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [cargar]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  // para el "tirar hacia abajo para actualizar"
  async function refrescar() {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  }

  return { datos, error, recargar, refrescando, refrescar };
}
