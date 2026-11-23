import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "../api";
import { Cargando, Chip, MensajeError, useDatos } from "../componentes";
import { cargarMascotasConDueno } from "../datos";
import { colores, estilos } from "../estilos";
import { proximosDiasHabiles } from "../fechas";

// Los mismos motivos del formulario web
const MOTIVOS = ["Consulta general", "Vacunación", "Control", "Desparasitación", "Cirugía", "Urgencia", "Otro"];
const DIAS_A_MOSTRAR = 14;
const MAX_OBSERVACIONES = 200;

export default function AgendarCitaPantalla({ route, navigation }) {
  const { datos: mascotas, error, recargar } = useDatos(cargarMascotasConDueno);
  const dias = proximosDiasHabiles(DIAS_A_MOSTRAR);

  const [mascotaId, setMascotaId] = useState(route.params?.mascotaId ?? null);
  const [fecha, setFecha] = useState(dias[0].iso);
  const [hora, setHora] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const [motivoOtro, setMotivoOtro] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [horarios, setHorarios] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cargarHorarios = useCallback(async () => {
    setHorarios(null);
    try {
      setHorarios(await api("GET", `/citas/horarios?fecha=${fecha}`));
    } catch (e) {
      setHorarios([]);
      setErrores((actuales) => ({ ...actuales, fecha: e.message }));
    }
  }, [fecha]);

  // al cambiar de día se piden sus horarios y se borra la hora elegida
  useEffect(() => {
    setHora(null);
    cargarHorarios();
  }, [cargarHorarios]);

  if (error && !mascotas) return <MensajeError mensaje={error} onReintentar={recargar} />;
  if (!mascotas) return <Cargando />;

  function validar() {
    const nuevos = {};
    if (!mascotaId) nuevos.mascotaId = "Selecciona la mascota.";
    if (!hora) nuevos.hora = "Elige una hora.";
    if (!motivo) nuevos.motivo = "Indica el motivo de la consulta.";
    else if (motivo === "Otro" && motivoOtro.trim().length < 3) nuevos.motivo = "Describe el motivo (al menos 3 caracteres).";
    return nuevos;
  }

  async function agendar() {
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const cita = await api("POST", "/citas", {
        mascotaId,
        fecha,
        hora,
        motivo: motivo === "Otro" ? motivoOtro.trim() : motivo,
        observaciones: observaciones.trim(),
      });
      const mascota = mascotas.find((m) => m.id === mascotaId);
      Alert.alert("¡Cita agendada!", `${mascota.nombre} quedó agendada a las ${cita.hora}.`);
      navigation.replace("DetalleCita", { id: cita.id });
    } catch (e) {
      // el servidor valida otra vez; sus mensajes se muestran bajo cada campo
      setErrores(Object.keys(e.errores).length > 0 ? e.errores : { general: e.message });
      // 409: alguien tomó la hora mientras se llenaba el formulario
      if (e.estado === 409) cargarHorarios();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={estilos.pantalla} contentContainerStyle={[estilos.contenido, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <Text style={estilos.etiqueta}>Mascota</Text>
        <View style={[estilos.tarjeta, { padding: 0, overflow: "hidden" }, errores.mascotaId && estilos.inputError]}>
          {mascotas.map((mascota, i) => {
            const elegida = mascota.id === mascotaId;
            return (
              <Pressable
                key={mascota.id}
                onPress={() => setMascotaId(mascota.id)}
                style={{
                  padding: 14,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colores.borde,
                  backgroundColor: elegida ? colores.mentaSuave : colores.blanco,
                }}
              >
                <Text style={[estilos.texto, { fontWeight: elegida ? "800" : "600" }]}>
                  {elegida ? "✓ " : ""}
                  {mascota.nombre} <Text style={estilos.subtitulo}>({mascota.especie})</Text>
                </Text>
                <Text style={estilos.subtitulo}>{mascota.dueno?.nombre}</Text>
              </Pressable>
            );
          })}
        </View>
        {errores.mascotaId && <Text style={estilos.textoError}>{errores.mascotaId}</Text>}

        <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Fecha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {dias.map((dia) => {
            const elegido = dia.iso === fecha;
            return (
              <Pressable
                key={dia.iso}
                onPress={() => {
                  setErrores(({ fecha: _, ...resto }) => resto);
                  setFecha(dia.iso);
                }}
                style={{
                  width: 64,
                  paddingVertical: 10,
                  borderRadius: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: elegido ? colores.azul : colores.borde,
                  backgroundColor: elegido ? colores.azul : colores.blanco,
                }}
              >
                <Text style={{ color: elegido ? colores.menta : colores.texto, fontSize: 12, fontWeight: "700" }}>{dia.nombre}</Text>
                <Text style={{ color: elegido ? colores.blanco : colores.azul, fontSize: 20, fontWeight: "800" }}>{dia.numero}</Text>
                <Text style={{ color: elegido ? colores.blanco : colores.texto, fontSize: 12 }}>{dia.mes}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {errores.fecha && <Text style={estilos.textoError}>{errores.fecha}</Text>}

        <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Hora</Text>
        {!horarios ? (
          <ActivityIndicator color={colores.azul} />
        ) : horarios.every((h) => !h.disponible) ? (
          <Text style={estilos.subtitulo}>No quedan horas libres este día. Prueba con otro.</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {horarios.map((h) => (
              <Chip key={h.hora} texto={h.hora} activo={h.hora === hora} desactivado={!h.disponible} onPress={() => setHora(h.hora)} />
            ))}
          </View>
        )}
        {errores.hora && <Text style={estilos.textoError}>{errores.hora}</Text>}

        <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Motivo</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {MOTIVOS.map((m) => (
            <Chip key={m} texto={m} activo={m === motivo} onPress={() => setMotivo(m)} />
          ))}
        </View>
        {motivo === "Otro" && (
          <TextInput
            style={[estilos.input, { marginTop: 4 }]}
            placeholder="¿Cuál es el motivo?"
            value={motivoOtro}
            onChangeText={setMotivoOtro}
            maxLength={60}
          />
        )}
        {errores.motivo && <Text style={estilos.textoError}>{errores.motivo}</Text>}

        <Text style={[estilos.etiqueta, { marginTop: 8 }]}>Observaciones (opcional)</Text>
        <TextInput
          style={[estilos.input, { minHeight: 80, textAlignVertical: "top" }]}
          multiline
          placeholder="Algo que el veterinario deba saber"
          value={observaciones}
          onChangeText={setObservaciones}
          maxLength={MAX_OBSERVACIONES}
        />
        {errores.observaciones && <Text style={estilos.textoError}>{errores.observaciones}</Text>}

        {errores.general && <Text style={estilos.textoError}>{errores.general}</Text>}

        <Pressable style={[estilos.boton, { marginTop: 12 }, enviando && { opacity: 0.5 }]} onPress={agendar} disabled={enviando}>
          <Text style={estilos.botonTexto}>{enviando ? "Agendando…" : "Agendar cita"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
