import { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Cargando, MensajeError, useDatos } from "../componentes";
import { cargarCitasConNombres, ordenarPorFecha } from "../datos";
import { colores, estilos } from "../estilos";
import { fechaLarga, fechaLocalISO } from "../fechas";
import FilaCita from "./FilaCita";

export default function InicioPantalla({ navigation }) {
  const hoy = fechaLocalISO();
  const cargar = useCallback(() => cargarCitasConNombres(`?fecha=${hoy}`), [hoy]);
  const { datos: citas, error, recargar, refrescando, refrescar } = useDatos(cargar);

  if (error && !citas) return <MensajeError mensaje={error} onReintentar={recargar} />;
  if (!citas) return <Cargando />;

  const pendientes = citas.filter((c) => c.estado === "pendiente").length;

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
    >
      <View style={[estilos.tarjeta, { backgroundColor: colores.azul, borderColor: colores.azul }]}>
        <Text style={{ color: colores.menta, fontWeight: "700" }}>{fechaLarga(hoy)}</Text>
        <Text style={{ color: colores.blanco, fontSize: 24, fontWeight: "800", marginTop: 6 }}>
          {pendientes === 0 ? "No quedan citas pendientes hoy" : `${pendientes} ${pendientes === 1 ? "cita pendiente" : "citas pendientes"} hoy`}
        </Text>
        <Pressable
          style={[estilos.boton, { backgroundColor: colores.menta, marginTop: 16 }]}
          onPress={() => navigation.navigate("AgendarCita")}
        >
          <Text style={[estilos.botonTexto, { color: colores.azul }]}>Agendar cita</Text>
        </Pressable>
      </View>

      <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Citas de hoy</Text>
      {citas.length === 0 && <Text style={estilos.subtitulo}>No hay citas agendadas para hoy.</Text>}
      {ordenarPorFecha(citas).map((cita) => (
        <FilaCita key={cita.id} cita={cita} onPress={() => navigation.navigate("DetalleCita", { id: cita.id })} />
      ))}
    </ScrollView>
  );
}
