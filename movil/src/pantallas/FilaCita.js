import { Pressable, Text, View } from "react-native";
import { EstadoCita } from "../componentes";
import { estilos } from "../estilos";
import { fechaCorta } from "../fechas";

// Una cita en las listas de Inicio y Citas
export default function FilaCita({ cita, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.7 }]}>
      <View style={estilos.fila}>
        <Text style={estilos.titulo}>{cita.mascota?.nombre ?? "Mascota eliminada"}</Text>
        <EstadoCita estado={cita.estado} />
      </View>
      <Text style={[estilos.subtitulo, { marginTop: 2 }]}>{cita.dueno?.nombre ?? ""}</Text>
      <View style={[estilos.fila, { marginTop: 10 }]}>
        <Text style={[estilos.texto, { fontWeight: "600" }]}>
          {fechaCorta(cita.fecha)} · {cita.hora}
        </Text>
        <Text style={[estilos.subtitulo, { flexShrink: 1, textAlign: "right" }]} numberOfLines={1}>
          {cita.motivo}
        </Text>
      </View>
    </Pressable>
  );
}
