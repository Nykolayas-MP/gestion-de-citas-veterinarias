import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Cargando, MensajeError, useDatos } from "../componentes";
import { cargarMascotasConDueno } from "../datos";
import { colores, estilos } from "../estilos";

// "Lúna" y "luna" cuentan igual al buscar
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function MascotasPantalla({ navigation }) {
  const { datos: mascotas, error, recargar, refrescando, refrescar } = useDatos(cargarMascotasConDueno);
  const [busqueda, setBusqueda] = useState("");

  if (error && !mascotas) return <MensajeError mensaje={error} onReintentar={recargar} />;
  if (!mascotas) return <Cargando />;

  // se busca por nombre de la mascota o del dueño, como en la web
  const texto = normalizar(busqueda.trim());
  const visibles = mascotas.filter((m) => normalizar(`${m.nombre} ${m.dueno?.nombre ?? ""}`).includes(texto));

  return (
    <View style={estilos.pantalla}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <TextInput style={estilos.input} placeholder="Buscar mascota o dueño" value={busqueda} onChangeText={setBusqueda} />
      </View>
      <FlatList
        data={visibles}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={[estilos.contenido, { paddingBottom: 96 }]}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
        ListHeaderComponent={
          <Text style={estilos.subtitulo}>
            Mostrando {visibles.length} de {mascotas.length} mascotas
          </Text>
        }
        ListEmptyComponent={<Text style={estilos.subtitulo}>No hay mascotas que coincidan con la búsqueda.</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("FichaMascota", { id: item.id })}
            style={({ pressed }) => [estilos.tarjeta, estilos.fila, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flexShrink: 1 }}>
              <Text style={estilos.titulo}>{item.nombre}</Text>
              <Text style={estilos.subtitulo}>
                {item.especie} · {item.raza} · {item.edad} {item.edad === 1 ? "año" : "años"}
              </Text>
              <Text style={[estilos.subtitulo, { marginTop: 4 }]}>{item.dueno?.nombre}</Text>
            </View>
            <Text style={{ color: colores.texto, fontSize: 22 }}>›</Text>
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => navigation.navigate("RegistrarMascota")}
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
        accessibilityLabel="Registrar mascota"
      >
        <Ionicons name="add" size={30} color={colores.blanco} />
      </Pressable>
    </View>
  );
}
