import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colores } from "./src/estilos";
import InicioPantalla from "./src/pantallas/InicioPantalla";
import CitasPantalla from "./src/pantallas/CitasPantalla";
import DetalleCitaPantalla from "./src/pantallas/DetalleCitaPantalla";
import AgendarCitaPantalla from "./src/pantallas/AgendarCitaPantalla";
import MascotasPantalla from "./src/pantallas/MascotasPantalla";
import FichaMascotaPantalla from "./src/pantallas/FichaMascotaPantalla";
import RegistrarMascotaPantalla from "./src/pantallas/RegistrarMascotaPantalla";

const Pila = createNativeStackNavigator();
const Pestanas = createBottomTabNavigator();

const ICONOS = { Inicio: "home", Citas: "calendar", Mascotas: "paw" };

const encabezado = {
  headerStyle: { backgroundColor: colores.azul },
  headerTintColor: colores.blanco,
  headerTitleStyle: { fontWeight: "700" },
};

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colores.fondo } };

// Las tres pestañas de abajo
function PantallasPrincipales() {
  return (
    <Pestanas.Navigator
      screenOptions={({ route }) => ({
        ...encabezado,
        tabBarActiveTintColor: colores.azul,
        tabBarInactiveTintColor: colores.texto,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? ICONOS[route.name] : `${ICONOS[route.name]}-outline`} size={size} color={color} />
        ),
      })}
    >
      <Pestanas.Screen name="Inicio" component={InicioPantalla} options={{ title: "VetCitas", tabBarLabel: "Inicio" }} />
      <Pestanas.Screen name="Citas" component={CitasPantalla} />
      <Pestanas.Screen name="Mascotas" component={MascotasPantalla} />
    </Pestanas.Navigator>
  );
}

// Las pantallas de detalle se abren encima de las pestañas, con flecha para volver
export default function App() {
  return (
    <NavigationContainer theme={tema}>
      <StatusBar style="light" />
      <Pila.Navigator screenOptions={encabezado}>
        <Pila.Screen name="Principal" component={PantallasPrincipales} options={{ headerShown: false }} />
        <Pila.Screen name="DetalleCita" component={DetalleCitaPantalla} options={{ title: "Detalle de la cita" }} />
        <Pila.Screen name="AgendarCita" component={AgendarCitaPantalla} options={{ title: "Agendar cita" }} />
        <Pila.Screen name="FichaMascota" component={FichaMascotaPantalla} options={{ title: "Ficha" }} />
        <Pila.Screen name="RegistrarMascota" component={RegistrarMascotaPantalla} options={{ title: "Registrar mascota" }} />
      </Pila.Navigator>
    </NavigationContainer>
  );
}
