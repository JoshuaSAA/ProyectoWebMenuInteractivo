import mqtt from "mqtt/dist/mqtt";

// Crear cliente MQTT con configuración simple
const client = mqtt.connect("ws://localhost:9002", {
    clientId: `frontend_${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    keepalive: 60
});

// Estado de conexión
let isConnected = false;

// Eventos de conexión
client.on("connect", () => {
    console.log("📡 Conectado a MQTT desde el navegador");
    isConnected = true;
    
    // Suscribirse a los tópicos que necesites
    client.subscribe([
        "pedidos/nuevos",
        "pedidos/actualizados", 
        "pedidos/estado"
    ]);
});

client.on("disconnect", () => {
    console.log("🔌 Desconectado de MQTT");
    isConnected = false;
});

client.on("error", (error) => {
    console.error("❌ Error de conexión MQTT:", error);
});

client.on("message", (topic, message) => {
    console.log(`📥 Mensaje recibido en ${topic}:`, message.toString());
});

// Funciones útiles para usar en tus componentes
export const publishMessage = (topic, message) => {
    if (isConnected) {
        const payload = typeof message === 'object' ? JSON.stringify(message) : message;
        client.publish(topic, payload);
        return true;
    } else {
        console.warn("⚠️ MQTT no conectado");
        return false;
    }
};

export const isConnectedToMqtt = () => isConnected;

export default client;