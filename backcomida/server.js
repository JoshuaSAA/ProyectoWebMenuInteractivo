import express from "express";
import cors from "cors";
import mqtt from "mqtt";
import pool from "./db.js";

const app = express();

// Configuración de CORS centralizada
app.use(cors({
    origin: "*", // Permitir todos los orígenes para desarrollo
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// Conexión MQTT
const mqttClient = mqtt.connect("mqtt://mqtt:1883", {
    clientId: `backend_${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
    keepalive: 60
});

// Estados de conexión MQTT
let mqttConnected = false;

mqttClient.on("connect", () => {
    console.log("🚀 MQTT conectado al broker");
    mqttConnected = true;
    
    // Suscribirse a múltiples topics
    const topics = [
        "pedidos/nuevos",      // Para recibir pedidos del frontend
        "pedidos/estado",      // Para manejar estados
        "pedidos/actualizados" // Para actualizaciones
    ];
    
    mqttClient.subscribe(topics, (err) => {
        if (err) {
            console.error("❌ Error suscribiéndose a topics:", err);
        } else {
            console.log("📡 Suscrito exitosamente a topics:", topics);
        }
    });
});

mqttClient.on("error", (error) => {
    console.error("❌ Error MQTT:", error);
    mqttConnected = false;
});

mqttClient.on("offline", () => {
    console.log("📴 MQTT desconectado");
    mqttConnected = false;
});

mqttClient.on("reconnect", () => {
    console.log("🔄 Reconectando MQTT...");
});

// Función para guardar pedido automáticamente desde MQTT
async function guardarPedidoEnDB(pedidoData) {
    try {
        const { id, estado, alimentos, total, timestamp } = pedidoData;
        
        console.log("💾 Guardando pedido en BD:", { id, estado, total });
        
        // Verificar si el pedido ya existe
        const [existente] = await pool.query("SELECT id FROM pedidos WHERE id = ?", [id]);
        
        if (existente.length > 0) {
            console.log("⚠️ Pedido ya existe en BD:", id);
            return;
        }
        
        // Insertar nuevo pedido
        const [result] = await pool.query(
            "INSERT INTO pedidos (id, estado, alimentos, total, fecha_creacion) VALUES (?, ?, ?, ?, ?)",
            [id, estado, JSON.stringify(alimentos), total, new Date(timestamp)]
        );
        
        console.log("✅ Pedido guardado exitosamente:", id);
        
        // Simular cambio de estado después de un tiempo
        setTimeout(() => {
            cambiarEstadoPedido(id, "En preparación");
        }, 3000); // 3 segundos después
        
        setTimeout(() => {
            cambiarEstadoPedido(id, "Listo");
        }, 15000); // 15 segundos después
        
    } catch (error) {
        console.error("❌ Error guardando pedido en BD:", error);
    }
}

// Función para cambiar estado de pedido y notificar por MQTT
async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
    try {
        // Actualizar en base de datos
        const [result] = await pool.query(
            "UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?",
            [nuevoEstado, pedidoId]
        );
        
        if (result.affectedRows > 0) {
            console.log(`🔄 Estado actualizado para pedido ${pedidoId}: ${nuevoEstado}`);
            
            // Notificar al frontend por MQTT
            if (mqttConnected) {
                const mensaje = {
                    pedidoId: pedidoId,
                    estado: nuevoEstado,
                    timestamp: new Date().toISOString()
                };
                
                mqttClient.publish("pedidos/estado", JSON.stringify(mensaje));
                console.log("📤 Notificación enviada al frontend:", mensaje);
            }
        }
        
    } catch (error) {
        console.error("❌ Error cambiando estado del pedido:", error);
    }
}

// Manejo de mensajes MQTT
mqttClient.on("message", (topic, message) => {
    console.log(`📥 Mensaje MQTT recibido en ${topic}`);
    
    try {
        const data = JSON.parse(message.toString());
        console.log("📋 Datos:", data);
        
        switch(topic) {
            case "pedidos/nuevos":
                console.log("🆕 Nuevo pedido recibido:", data.id);
                guardarPedidoEnDB(data);
                break;
                
            case "pedidos/estado":
                console.log("🔄 Actualización de estado:", data);
                break;
                
            case "pedidos/actualizados":
                console.log("✅ Pedido actualizado:", data);
                break;
                
            default:
                console.log("❓ Topic desconocido:", topic);
        }
    } catch (error) {
        console.error("❌ Error procesando mensaje MQTT:", error);
    }
});

// Ruta de health check
app.get("/", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "Backend funcionando correctamente",
        mqtt_connected: mqttConnected,
        timestamp: new Date().toISOString()
    });
});

// Obtener todos los pedidos
app.get("/pedidos", async (req, res) => {
    try {
        const [pedidos] = await pool.query(
            "SELECT * FROM pedidos ORDER BY fecha_creacion DESC"
        );
        
        // Parsear alimentos JSON
        const pedidosFormateados = pedidos.map(pedido => ({
            ...pedido,
            alimentos: typeof pedido.alimentos === 'string' 
                ? JSON.parse(pedido.alimentos) 
                : pedido.alimentos
        }));
        
        res.json(pedidosFormateados);
    } catch (error) {
        console.error("❌ Error obteniendo pedidos:", error);
        res.status(500).json({ error: "Error al obtener los pedidos" });
    }
});

// Obtener pedido específico
app.get("/pedidos/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const [pedidos] = await pool.query("SELECT * FROM pedidos WHERE id = ?", [id]);
        
        if (pedidos.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }
        
        const pedido = {
            ...pedidos[0],
            alimentos: typeof pedidos[0].alimentos === 'string' 
                ? JSON.parse(pedidos[0].alimentos) 
                : pedidos[0].alimentos
        };
        
        res.json(pedido);
    } catch (error) {
        console.error("❌ Error obteniendo pedido:", error);
        res.status(500).json({ error: "Error al obtener el pedido" });
    }
});

// Crear nuevo pedido (vía REST API)
app.post("/pedidos", async (req, res) => {
    const { estado, alimentos, total } = req.body;
    
    // Validación básica
    if (!estado || !alimentos) {
        return res.status(400).json({ error: "Estado y alimentos son requeridos" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO pedidos (estado, alimentos, total, fecha_creacion) VALUES (?, ?, ?, NOW())",
            [estado, JSON.stringify(alimentos), total || 0]
        );

        const nuevoPedido = {
            id: result.insertId,
            estado,
            alimentos,
            total: total || 0
        };

        // Publicar en MQTT si está conectado
        if (mqttConnected) {
            mqttClient.publish("pedidos/nuevos", JSON.stringify(nuevoPedido));
            console.log("📤 Pedido publicado en MQTT:", nuevoPedido.id);
        }
        
        res.status(201).json(nuevoPedido);
    } catch (error) {
        console.error("❌ Error al crear pedido:", error);
        res.status(500).json({ error: "Error al registrar el pedido" });
    }
});

// Actualizar estado de pedido manualmente
app.put("/pedidos/:id", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ error: "Estado es requerido" });
    }

    try {
        const [result] = await pool.query(
            "UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?",
            [estado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        // Publicar actualización en MQTT
        if (mqttConnected) {
            const mensaje = {
                pedidoId: parseInt(id),
                estado,
                timestamp: new Date().toISOString()
            };
            
            mqttClient.publish("pedidos/estado", JSON.stringify(mensaje));
            console.log("📤 Estado actualizado y notificado:", mensaje);
        }

        res.json({ 
            id: parseInt(id), 
            estado, 
            mensaje: "Pedido actualizado correctamente" 
        });
    } catch (error) {
        console.error("❌ Error al actualizar pedido:", error);
        res.status(500).json({ error: "Error al actualizar el pedido" });
    }
});

// Eliminar pedido
app.delete("/pedidos/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM pedidos WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        res.json({ mensaje: "Pedido eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar pedido:", error);
        res.status(500).json({ error: "Error al eliminar el pedido" });
    }
});

// Ruta para obtener estadísticas
app.get("/estadisticas", async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                COUNT(CASE WHEN estado = 'En espera' THEN 1 END) as en_espera,
                COUNT(CASE WHEN estado = 'En preparación' THEN 1 END) as en_preparacion,
                COUNT(CASE WHEN estado = 'Listo' THEN 1 END) as listos,
                COALESCE(SUM(total), 0) as ventas_total
            FROM pedidos
        `);
        
        res.json(stats[0]);
    } catch (error) {
        console.error("❌ Error obteniendo estadísticas:", error);
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
});

// Manejo de errores 404
app.use("*", (req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    console.error("❌ Error no manejado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en puerto ${PORT}`);
    console.log(`📡 MQTT configurado para conectar a mqtt://mqtt:1883`);
});

// Manejo graceful del cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    if (mqttClient) {
        mqttClient.end();
    }
    process.exit(0);
});