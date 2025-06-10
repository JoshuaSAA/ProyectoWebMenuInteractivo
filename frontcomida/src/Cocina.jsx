import { useState, useEffect, useRef } from "react";
import client from "./mqttClient";

export default function Cocina() {
    const [pedidos, setPedidos] = useState([]);
    const [todasLasOrdenes, setTodasLasOrdenes] = useState([]);
    const [mostrandoTodas, setMostrandoTodas] = useState(false);
    const [cargando, setCargando] = useState(false);
    const timersRef = useRef({});

    // URL de tu backend - ajusta según tu configuración Docker
    const BACKEND_URL = 'http://localhost:3000';

    useEffect(() => {
        client.subscribe("pedidos/nuevos");

        const mensajeHandler = (topic, message) => {
            if (topic === "pedidos/nuevos") {
                const nuevoPedido = JSON.parse(message.toString());

                setPedidos(prev => {
                    const yaExiste = prev.some(p => p.id === nuevoPedido.id);
                    if (yaExiste) return prev;
                    return [...prev, { ...nuevoPedido, estado: "Recibido" }];
                });

                console.log("📡 Pedido recibido en cocina:", nuevoPedido);

                setTimeout(() => {
                    actualizarEstado(nuevoPedido.id, "En preparación");
                }, 10000);

                setTimeout(() => {
                    actualizarEstado(nuevoPedido.id, "Listo");
                }, 20000);
            }
        };

        client.on("message", mensajeHandler);

        return () => {
            client.removeListener("message", mensajeHandler);
        };
    }, []);

    // Función para obtener todas las órdenes del backend
    const obtenerTodasLasOrdenes = async () => {
        setCargando(true);
        try {
            const response = await fetch(`${BACKEND_URL}/pedidos`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const ordenes = await response.json();
            setTodasLasOrdenes(ordenes);
            setMostrandoTodas(true);
            console.log("📋 Órdenes obtenidas:", ordenes.length);
        } catch (error) {
            console.error("❌ Error obteniendo todas las órdenes:", error);
            alert("Error al cargar las órdenes. Verifica la conexión con el backend.");
        } finally {
            setCargando(false);
        }
    };

    function actualizarEstado(pedidoId, nuevoEstado) {
        setPedidos(prev => {
            const pedidosActualizados = prev.map(p =>
                p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
            );
            return pedidosActualizados;
        });

        client.publish("pedidos/estado", JSON.stringify({
            pedidoId,
            estado: nuevoEstado
        }));

        console.log(`📨 Estado actualizado: Pedido ${pedidoId} → ${nuevoEstado}`);
    }

    const getEstadoStyle = (estado) => {
        const base = {
            border: "2px solid",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        };
        switch (estado) {
            case "Recibido":
                return { ...base, backgroundColor: "#e0f0ff", borderColor: "#3399ff" };
            case "En preparación":
                return { ...base, backgroundColor: "#fff4e0", borderColor: "#ff9900" };
            case "Listo":
                return { ...base, backgroundColor: "#e0ffe0", borderColor: "#33cc66" };
            case "En espera":
                return { ...base, backgroundColor: "#f0f0f0", borderColor: "#888888" };
            default:
                return base;
        }
    };

    const buttonStyle = {
        padding: "8px 12px",
        marginRight: "8px",
        marginTop: "8px",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer",
    };

    const buttonPrep = {
        ...buttonStyle,
        backgroundColor: "#ffaa00",
        color: "white",
    };

    const buttonListo = {
        ...buttonStyle,
        backgroundColor: "#33cc66",
        color: "white",
    };

    const buttonVerTodas = {
        ...buttonStyle,
        backgroundColor: "#007bff",
        color: "white",
        fontSize: "16px",
        padding: "12px 20px",
        marginBottom: "20px",
    };

    const buttonVolver = {
        ...buttonStyle,
        backgroundColor: "#6c757d",
        color: "white",
        fontSize: "16px",
        padding: "12px 20px",
        marginBottom: "20px",
    };

    // Función para formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return "Sin fecha";
        return new Date(fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const pedidosAMostrar = mostrandoTodas ? todasLasOrdenes : pedidos;

    return (
        <div style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "24px", margin: 0 }}>
                    👨‍🍳 {mostrandoTodas ? "Todas las Órdenes" : "Pedidos en Cocina"}
                </h2>
                
                <div>
                    {!mostrandoTodas ? (
                        <button
                            onClick={obtenerTodasLasOrdenes}
                            style={buttonVerTodas}
                            disabled={cargando}
                        >
                            {cargando ? "⏳ Cargando..." : "📋 Ver Todas las Órdenes"}
                        </button>
                    ) : (
                        <button
                            onClick={() => setMostrandoTodas(false)}
                            style={buttonVolver}
                        >
                            ⬅️ Volver a Cocina
                        </button>
                    )}
                </div>
            </div>

            {mostrandoTodas && (
                <div style={{ 
                    backgroundColor: "#f8f9fa", 
                    padding: "12px", 
                    borderRadius: "6px", 
                    marginBottom: "20px",
                    border: "1px solid #dee2e6"
                }}>
                    <strong>📊 Total de órdenes: {todasLasOrdenes.length}</strong>
                </div>
            )}

            {pedidosAMostrar.length === 0 ? (
                <p style={{ color: "#888" }}>
                    📭 {mostrandoTodas ? "No hay órdenes registradas..." : "No hay pedidos aún..."}
                </p>
            ) : (
                pedidosAMostrar.map((pedido) => (
                    <div key={pedido.id} style={getEstadoStyle(pedido.estado)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <h3 style={{ margin: 0 }}>🍽 Pedido #{pedido.id}</h3>
                            {mostrandoTodas && (
                                <span style={{ fontSize: "12px", color: "#666" }}>
                                    📅 {formatearFecha(pedido.fecha_creacion)}
                                </span>
                            )}
                        </div>
                        
                        <p style={{ margin: "4px 0" }}>
                            <strong>Estado:</strong> 
                            <span style={{ 
                                padding: "2px 8px", 
                                borderRadius: "12px", 
                                backgroundColor: "rgba(255,255,255,0.7)",
                                marginLeft: "8px"
                            }}>
                                {pedido.estado}
                            </span>
                        </p>

                        {pedido.total && (
                            <p style={{ margin: "4px 0" }}>
                                <strong>Total:</strong> ${pedido.total}
                            </p>
                        )}

                        <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                            {pedido.alimentos && pedido.alimentos.map((item, i) => (
                                <li key={i}>{item.cantidad}x {item.nombre}</li>
                            ))}
                        </ul>

                        {/* Solo mostrar botones de acción para pedidos activos (no para el historial completo) */}
                        {!mostrandoTodas && (
                            <div>
                                <button
                                    onClick={() => actualizarEstado(pedido.id, "En preparación")}
                                    style={buttonPrep}
                                    disabled={pedido.estado === "Listo"}
                                >
                                    🧑‍🍳 En preparación
                                </button>
                                <button
                                    onClick={() => actualizarEstado(pedido.id, "Listo")}
                                    style={buttonListo}
                                    disabled={pedido.estado === "Listo"}
                                >
                                    ✅ Listo
                                </button>
                            </div>
                        )}

                        {mostrandoTodas && pedido.fecha_actualizacion && (
                            <p style={{ fontSize: "12px", color: "#666", margin: "8px 0 0 0" }}>
                                <strong>Última actualización:</strong> {formatearFecha(pedido.fecha_actualizacion)}
                            </p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}