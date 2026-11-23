import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api } from "../api";
import { Cargando, Chip, MensajeError, useDatos } from "../componentes";
import { colores, estilos } from "../estilos";
import {
  EDAD_MAXIMA,
  capitalizar,
  esEdadValida,
  esEmailValido,
  esRutValido,
  esTelefonoValido,
  esTextoValido,
  formatearRut,
  formatearTelefono,
  limpiarRut,
} from "../validaciones";

// Las mismas del select de la web y del backend
const ESPECIES = ["Perro", "Gato", "Conejo", "Hámster", "Ave", "Otro"];

async function cargarDuenos() {
  const duenos = await api("GET", "/duenos");
  return duenos.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Un campo de texto con su etiqueta y su mensaje de error
function Campo({ etiqueta, error, ...props }) {
  return (
    <View>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput style={[estilos.input, error && estilos.inputError]} {...props} />
      {error && <Text style={estilos.textoError}>{error}</Text>}
    </View>
  );
}

export default function RegistrarMascotaPantalla({ navigation }) {
  const { datos: duenos, error, recargar } = useDatos(cargarDuenos);

  const [mascota, setMascota] = useState({ nombre: "", especie: null, raza: "", edad: "" });
  const [duenoNuevo, setDuenoNuevo] = useState(false);
  const [duenoId, setDuenoId] = useState(null);
  const [buscarDueno, setBuscarDueno] = useState("");
  const [dueno, setDueno] = useState({ nombre: "", rut: "", telefono: "", email: "" });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  if (error && !duenos) return <MensajeError mensaje={error} onReintentar={recargar} />;
  if (!duenos) return <Cargando />;

  // los errores del dueño nuevo llevan prefijo para no chocar con los de la mascota (nombre)
  const cambiarMascota = (campo) => (valor) => {
    setMascota((actual) => ({ ...actual, [campo]: valor }));
    setErrores(({ [campo]: _, ...resto }) => resto);
  };
  const cambiarDueno = (campo) => (valor) => {
    setDueno((actual) => ({ ...actual, [campo]: valor }));
    setErrores(({ [`dueno.${campo}`]: _, ...resto }) => resto);
  };

  function validar() {
    const nuevos = {};
    if (!mascota.nombre.trim()) nuevos.nombre = "Escribe el nombre de la mascota.";
    else if (!esTextoValido(mascota.nombre)) nuevos.nombre = "El nombre solo puede tener letras y espacios.";
    if (!mascota.especie) nuevos.especie = "Selecciona la especie.";
    if (!mascota.raza.trim()) nuevos.raza = "Escribe la raza (o \"Mestizo\").";
    else if (!esTextoValido(mascota.raza)) nuevos.raza = "La raza solo puede tener letras y espacios.";
    if (!mascota.edad.trim()) nuevos.edad = "Escribe la edad.";
    else if (!esEdadValida(mascota.edad)) nuevos.edad = `La edad debe ser un número entero entre 0 y ${EDAD_MAXIMA}.`;

    if (!duenoNuevo) {
      if (!duenoId) nuevos.duenoId = "Selecciona el dueño.";
      return nuevos;
    }
    if (!dueno.nombre.trim()) nuevos["dueno.nombre"] = "Escribe el nombre del dueño.";
    else if (!esTextoValido(dueno.nombre)) nuevos["dueno.nombre"] = "El nombre solo puede tener letras y espacios.";
    if (!dueno.rut.trim()) nuevos["dueno.rut"] = "Escribe el RUT del dueño.";
    else if (!esRutValido(dueno.rut)) nuevos["dueno.rut"] = "El RUT no es válido. Revisa el dígito verificador.";
    else if (duenos.some((d) => limpiarRut(d.rut) === limpiarRut(dueno.rut)))
      nuevos["dueno.rut"] = "Ya existe un dueño con este RUT. Elígelo en \"Dueño registrado\".";
    if (!dueno.telefono.trim()) nuevos["dueno.telefono"] = "Escribe el teléfono del dueño.";
    else if (!esTelefonoValido(dueno.telefono)) nuevos["dueno.telefono"] = "Usa el formato +56 9 1234 5678.";
    if (!dueno.email.trim()) nuevos["dueno.email"] = "Escribe el correo del dueño.";
    else if (!esEmailValido(dueno.email)) nuevos["dueno.email"] = "El correo no tiene un formato válido.";
    return nuevos;
  }

  async function registrar() {
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      // un aviso abajo, cerca del botón, porque el error puede quedar arriba fuera de la vista
      setErrores({ ...nuevos, general: "Revisa los campos marcados en rojo." });
      return;
    }

    setEnviando(true);
    let idDueno = duenoId;

    // primero el dueño, porque la mascota necesita su id
    if (duenoNuevo) {
      try {
        const creado = await api("POST", "/duenos", {
          nombre: capitalizar(dueno.nombre),
          rut: formatearRut(dueno.rut),
          telefono: formatearTelefono(dueno.telefono),
          email: dueno.email.trim().toLowerCase(),
        });
        idDueno = creado.id;
        // si después falla la mascota, al reintentar no se vuelve a crear el dueño
        await recargar();
        setDuenoNuevo(false);
        setDuenoId(creado.id);
        setDueno({ nombre: "", rut: "", telefono: "", email: "" });
      } catch (e) {
        const deServidor = Object.fromEntries(Object.entries(e.errores).map(([campo, msj]) => [`dueno.${campo}`, msj]));
        setErrores(Object.keys(deServidor).length > 0 ? deServidor : { general: e.message });
        setEnviando(false);
        return;
      }
    }

    try {
      const creada = await api("POST", "/mascotas", {
        nombre: capitalizar(mascota.nombre),
        especie: mascota.especie,
        raza: capitalizar(mascota.raza),
        edad: Number(mascota.edad),
        duenoId: idDueno,
      });
      Alert.alert("¡Mascota registrada!", `Se registró a ${creada.nombre} correctamente.`);
      navigation.replace("FichaMascota", { id: creada.id });
    } catch (e) {
      // 409: el dueño ya tiene una mascota con ese nombre
      setErrores(Object.keys(e.errores).length > 0 ? e.errores : { general: e.message });
    } finally {
      setEnviando(false);
    }
  }

  const texto = normalizar(buscarDueno.trim());
  const duenosVisibles = duenos.filter((d) => normalizar(`${d.nombre} ${d.rut} ${limpiarRut(d.rut)}`).includes(texto));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={estilos.pantalla} contentContainerStyle={[estilos.contenido, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <Text style={estilos.titulo}>Datos de la mascota</Text>
        <Campo etiqueta="Nombre" placeholder="Ej: Luna" value={mascota.nombre} onChangeText={cambiarMascota("nombre")} error={errores.nombre} maxLength={40} />

        <View>
          <Text style={estilos.etiqueta}>Especie</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ESPECIES.map((especie) => (
              <Chip key={especie} texto={especie} activo={especie === mascota.especie} onPress={() => cambiarMascota("especie")(especie)} />
            ))}
          </View>
          {errores.especie && <Text style={estilos.textoError}>{errores.especie}</Text>}
        </View>

        <Campo etiqueta="Raza" placeholder="Ej: Mestizo" value={mascota.raza} onChangeText={cambiarMascota("raza")} error={errores.raza} maxLength={40} />
        <Campo
          etiqueta="Edad (años)"
          placeholder={`0 a ${EDAD_MAXIMA}`}
          keyboardType="number-pad"
          value={mascota.edad}
          onChangeText={cambiarMascota("edad")}
          error={errores.edad}
          maxLength={2}
        />

        <Text style={[estilos.titulo, { marginTop: 12 }]}>Dueño</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip texto="Dueño registrado" activo={!duenoNuevo} onPress={() => setDuenoNuevo(false)} />
          <Chip texto="Dueño nuevo" activo={duenoNuevo} onPress={() => setDuenoNuevo(true)} />
        </View>

        {!duenoNuevo ? (
          <>
            <TextInput style={estilos.input} placeholder="Buscar por nombre o RUT" value={buscarDueno} onChangeText={setBuscarDueno} />
            <View style={[estilos.tarjeta, { padding: 0, overflow: "hidden" }, errores.duenoId && estilos.inputError]}>
              {duenosVisibles.length === 0 && <Text style={[estilos.subtitulo, { padding: 14 }]}>No hay dueños que coincidan.</Text>}
              {duenosVisibles.map((d, i) => {
                const elegido = d.id === duenoId;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => {
                      setDuenoId(d.id);
                      setErrores(({ duenoId: _, ...resto }) => resto);
                    }}
                    style={{
                      padding: 14,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colores.borde,
                      backgroundColor: elegido ? colores.mentaSuave : colores.blanco,
                    }}
                  >
                    <Text style={[estilos.texto, { fontWeight: elegido ? "800" : "600" }]}>
                      {elegido ? "✓ " : ""}
                      {d.nombre}
                    </Text>
                    <Text style={estilos.subtitulo}>{d.rut}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errores.duenoId && <Text style={estilos.textoError}>{errores.duenoId}</Text>}
          </>
        ) : (
          <>
            <Campo etiqueta="Nombre del dueño" placeholder="Ej: Camila Rojas" value={dueno.nombre} onChangeText={cambiarDueno("nombre")} error={errores["dueno.nombre"]} maxLength={60} />
            <Campo
              etiqueta="RUT"
              placeholder="12.345.678-5"
              autoCapitalize="characters"
              value={dueno.rut}
              onChangeText={cambiarDueno("rut")}
              error={errores["dueno.rut"]}
              maxLength={12}
            />
            <Campo
              etiqueta="Teléfono"
              placeholder="+56 9 1234 5678"
              keyboardType="phone-pad"
              value={dueno.telefono}
              onChangeText={cambiarDueno("telefono")}
              error={errores["dueno.telefono"]}
              maxLength={16}
            />
            <Campo
              etiqueta="Correo"
              placeholder="nombre@correo.cl"
              keyboardType="email-address"
              autoCapitalize="none"
              value={dueno.email}
              onChangeText={cambiarDueno("email")}
              error={errores["dueno.email"]}
              maxLength={80}
            />
          </>
        )}

        {errores.general && <Text style={estilos.textoError}>{errores.general}</Text>}

        <Pressable style={[estilos.boton, { marginTop: 12 }, enviando && { opacity: 0.5 }]} onPress={registrar} disabled={enviando}>
          <Text style={estilos.botonTexto}>{enviando ? "Registrando…" : "Registrar mascota"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
