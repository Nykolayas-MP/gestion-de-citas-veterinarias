import { useCallback, useEffect } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { api } from "../api";
import { Cargando, Dato, EstadoCita, MensajeError, useDatos } from "../componentes";
import { ordenarPorFecha } from "../datos";
import { colores, estilos } from "../estilos";
import { fechaCorta } from "../fechas";

export default function FichaMascotaPantalla({ route, navigation }) {
  const { id } = route.params;

  const cargar = useCallback(async () => {
    const mascota = await api("GET", `/mascotas/${id}`);
    const [dueno, atenciones, citas] = await Promise.all([
      api("GET", `/duenos/${mascota.duenoId}`),
      api("GET", `/mascotas/${id}/atenciones`),
      api("GET", `/citas?mascotaId=${id}`),
    ]);
    return { mascota, dueno, atenciones, citas };
  }, [id]);
  const { datos, error, recargar, refrescando, refrescar } = useDatos(cargar);

  // el título de arriba pasa a ser el nombre de la mascota
  useEffect(() => {
    if (datos) navigation.setOptions({ title: datos.mascota.nombre });
  }, [datos, navigation]);

  if (error && !datos) return <MensajeError mensaje={error} onReintentar={recargar} />;
  if (!datos) return <Cargando />;

  const { mascota, dueno, atenciones, citas } = datos;
  // el motivo de cada atención está en su cita
  const motivoDe = (citaId) => citas.find((c) => c.id === citaId)?.motivo ?? "Atención";

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
    >
      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Datos de la mascota</Text>
        <Dato etiqueta="Especie" valor={mascota.especie} />
        <Dato etiqueta="Raza" valor={mascota.raza} />
        <Dato etiqueta="Edad" valor={`${mascota.edad} ${mascota.edad === 1 ? "año" : "años"}`} />
        <Text style={[estilos.etiqueta, { marginTop: 16 }]}>Dueño</Text>
        <Dato etiqueta="Nombre" valor={dueno.nombre} />
        <Dato etiqueta="RUT" valor={dueno.rut} />
        <Dato etiqueta="Teléfono" valor={dueno.telefono} />
        <Dato etiqueta="Correo" valor={dueno.email} />
      </View>

      <Pressable style={estilos.boton} onPress={() => navigation.navigate("AgendarCita", { mascotaId: mascota.id })}>
        <Text style={estilos.botonTexto}>Agendar cita para {mascota.nombre}</Text>
      </Pressable>

      <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Historial clínico</Text>
      {atenciones.length === 0 && <Text style={estilos.subtitulo}>Todavía no tiene atenciones registradas.</Text>}
      {[...atenciones].reverse().map((atencion) => (
        <View key={atencion.id} style={[estilos.tarjeta, { borderLeftWidth: 4, borderLeftColor: colores.menta }]}>
          <View style={estilos.fila}>
            <Text style={estilos.titulo}>{motivoDe(atencion.citaId)}</Text>
            <Text style={estilos.subtitulo}>{fechaCorta(atencion.fecha)}</Text>
          </View>
          <Text style={[estilos.etiqueta, { marginTop: 10 }]}>Diagnóstico</Text>
          <Text style={estilos.texto}>{atencion.diagnostico}</Text>
          <Text style={[estilos.etiqueta, { marginTop: 10 }]}>Tratamiento</Text>
          <Text style={estilos.texto}>{atencion.tratamiento}</Text>
          {atencion.medicamentos ? (
            <>
              <Text style={[estilos.etiqueta, { marginTop: 10 }]}>Medicamentos</Text>
              <Text style={estilos.texto}>{atencion.medicamentos}</Text>
            </>
          ) : null}
        </View>
      ))}

      <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Citas</Text>
      {citas.length === 0 && <Text style={estilos.subtitulo}>No tiene citas.</Text>}
      {ordenarPorFecha(citas)
        .reverse()
        .map((cita) => (
          <Pressable
            key={cita.id}
            onPress={() => navigation.navigate("DetalleCita", { id: cita.id })}
            style={({ pressed }) => [estilos.tarjeta, estilos.fila, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flexShrink: 1 }}>
              <Text style={[estilos.texto, { fontWeight: "700" }]}>
                {fechaCorta(cita.fecha)} · {cita.hora}
              </Text>
              <Text style={estilos.subtitulo}>{cita.motivo}</Text>
            </View>
            <EstadoCita estado={cita.estado} />
          </Pressable>
        ))}
    </ScrollView>
  );
}
