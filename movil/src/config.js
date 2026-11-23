import Constants from "expo-constants";

// El servidor corre en el mismo computador que Expo, así que usamos la IP con la que
// Expo Go se conectó (ej: "192.168.1.10:8081") y le cambiamos el puerto por el 3000.
// Si no conecta, se puede escribir a mano: "http://192.168.1.10:3000/api"
const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";

export const API_URL = `http://${host}:3000/api`;
