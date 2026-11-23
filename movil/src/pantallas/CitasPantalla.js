import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Cargando, Chip, MensajeError, useDatos } from "../componentes";
import { cargarCitasConNombres, ordenarPorFecha } from "../datos";
import { colores, estilos } from "../estilos";
import FilaCita from "./FilaCita";

const FILTROS = [
  { valor: "", texto: "Todas" },
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "atendida", texto: "Atendidas" },
  { valor: "cancelada", texto: "Canceladas" },
];

export default function CitasPantalla({ navigation }) {
  const [estado, setEstado] = useState("");
  // el filtro lo aplica el servidor: GET /api/citas?estado=pendiente
  const cargar = useCallback(() => cargarCitasConNombres(estado ? `?estado=${estado}` : ""), [estado]);
  const { datos: citas, error, recargar, refrescando, refrescar } = useDatos(cargar);

  return (
    <View style={estilos.pantalla}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 4, gap: 8 }}>
          {FILTROS.map((filtro) => (
            <Chip key={filtro.valor} texto={filtro.texto} activo={estado === filtro.valor} onPress={() => setEstado(filtro.valor)} />
          ))}
        </ScrollView>
      </View>

      {error && !citas ? (
        <MensajeError mensaje={error} onReintentar={recargar} />
      ) : !citas ? (
        <Cargando />
      ) : (
        <FlatList
          data={ordenarPorFecha(citas)}
          keyExtractor={(cita) => String(cita.id)}
          contentContainerStyle={[estilos.contenido, { paddingBottom: 96 }]}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
          ListHeaderComponent={<Text style={estilos.subtitulo}>{citas.length} {citas.length === 1 ? "cita" : "citas"}</Text>}
          ListEmptyComponent={<Text style={estilos.subtitulo}>No hay citas con este filtro.</Text>}
          renderItem={({ item }) => <FilaCita cita={item} onPress={() => navigation.navigate("DetalleCita", { id: item.id })} />}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate("AgendarCita")}
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colores.azul,
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
        }}
        accessibilityLabel="Agendar cita"
      >
        <Ionicons name="add" size={30} color={colores.blanco} />
      </Pressable>
    </View>
  );
}
