import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../api";
import { Cargando, Dato, EstadoCita, MensajeError, useDatos } from "../componentes";
import { estilos } from "../estilos";
import { fechaLarga } from "../fechas";

export default function DetalleCitaPantalla({ route, navigation }) {
  const { id } = route.params;
  const [cancelando, setCancelando] = useState(false);

  const cargar = useCallback(async () => {
    const cita = await api("GET", `/citas/${id}`);
    const mascota = await api("GET", `/mascotas/${cita.mascotaId}`);
    const dueno = await api("GET", `/duenos/${mascota.duenoId}`);
    return { cita, mascota, dueno };
  }, [id]);
  const { datos, error, recargar } = useDatos(cargar);

  if (error && !datos) return <MensajeError mensaje={error} onReintentar={recargar} />;
  if (!datos) return <Cargando />;

  const { cita, mascota, dueno } = datos;

  function confirmarCancelacion() {
    Alert.alert("Cancelar cita", `¿Cancelar la cita de ${mascota.nombre} del ${fechaLarga(cita.fecha)} a las ${cita.hora}?`, [
      { text: "No", style: "cancel" },
      { text: "Sí, cancelar", style: "destructive", onPress: cancelar },
    ]);
  }

  async function cancelar() {
    setCancelando(true);
    try {
      await api("PATCH", `/citas/${cita.id}/cancelar`);
      await recargar();
    } catch (e) {
      Alert.alert("No se pudo cancelar", e.message);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <View style={estilos.tarjeta}>
        <View style={estilos.fila}>
          <Text style={estilos.titulo}>{cita.motivo}</Text>
          <EstadoCita estado={cita.estado} />
        </View>
        <Dato etiqueta="Fecha" valor={fechaLarga(cita.fecha)} />
        <Dato etiqueta="Hora" valor={`${cita.hora} hrs`} />
        <Dato etiqueta="Observaciones" valor={cita.observaciones || "—"} />
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Mascota</Text>
        <Dato etiqueta="Nombre" valor={mascota.nombre} />
        <Dato etiqueta="Especie" valor={`${mascota.especie} · ${mascota.raza}`} />
        <Text style={[estilos.etiqueta, { marginTop: 16 }]}>Dueño</Text>
        <Dato etiqueta="Nombre" valor={dueno.nombre} />
        <Dato etiqueta="Teléfono" valor={dueno.telefono} />
      </View>

      <Pressable style={estilos.boton} onPress={() => navigation.navigate("FichaMascota", { id: mascota.id })}>
        <Text style={estilos.botonTexto}>Ver ficha de {mascota.nombre}</Text>
      </Pressable>

      {cita.estado === "pendiente" && (
        <Pressable style={[estilos.botonSecundario, cancelando && { opacity: 0.5 }]} onPress={confirmarCancelacion} disabled={cancelando}>
          <Text style={estilos.botonSecundarioTexto}>{cancelando ? "Cancelando…" : "Cancelar cita"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
