import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Clock, Star, Users, ChefHat } from 'lucide-react';
import client from './mqttClient'; // Importar tu cliente MQTT

const MenuInteractivo = () => {
  const [carrito, setCarrito] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('hamburguesas');
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  
  // Nuevos estados para MQTT
  const [pedidoId, setPedidoId] = useState(null);
  const [estadoActual, setEstadoActual] = useState("En espera");
  const [mostrarProgreso, setMostrarProgreso] = useState(false);

  const categorias = [
    { id: 'hamburguesas', nombre: 'Hamburguesas', icono: '🍔' },
    { id: 'bebidas', nombre: 'Bebidas', icono: '🥤' },
    { id: 'acompañamientos', nombre: 'Acompañamientos', icono: '🍟' },
    { id: 'postres', nombre: 'Postres', icono: '🍰' },
    { id: 'desayunos', nombre: 'Desayunos', icono: '🥞' }
  ];

  const productos = {
    hamburguesas: [
      { id: 1, nombre: 'Big Mac', precio: 180.00, imagen: '🍔', descripcion: 'Doble carne, lechuga, queso, pepinillos', tiempo: '5-7 min', rating: 4.8 },
      { id: 2, nombre: 'Quarter Pounder', precio: 165.00, imagen: '🍔', descripcion: 'Carne de res, queso, cebolla, pepinillos', tiempo: '6-8 min', rating: 4.7 },
      { id: 3, nombre: 'McChicken', precio: 95.00, imagen: '🍗', descripcion: 'Pollo empanizado, lechuga, mayonesa', tiempo: '4-6 min', rating: 4.5 },
      { id: 4, nombre: 'Filet-O-Fish', precio: 110.00, imagen: '🐟', descripcion: 'Pescado empanizado, queso, salsa tártara', tiempo: '5-7 min', rating: 4.3 }
    ],
    bebidas: [
      { id: 5, nombre: 'Coca-Cola', precio: 35.00, imagen: '🥤', descripcion: 'Bebida gaseosa clásica - Grande', tiempo: '1 min', rating: 4.9 },
      { id: 6, nombre: 'Sprite', precio: 35.00, imagen: '🥤', descripcion: 'Bebida de lima-limón - Grande', tiempo: '1 min', rating: 4.6 },
      { id: 7, nombre: 'Café McCafé', precio: 45.00, imagen: '☕', descripcion: 'Café premium recién preparado', tiempo: '2-3 min', rating: 4.4 },
      { id: 8, nombre: 'Malteada', precio: 65.00, imagen: '🥤', descripcion: 'Malteada de vainilla cremosa', tiempo: '3-4 min', rating: 4.7 }
    ],
    acompañamientos: [
      { id: 9, nombre: 'Papas Fritas', precio: 45.00, imagen: '🍟', descripcion: 'Papas doradas y crujientes - Grande', tiempo: '3-4 min', rating: 4.8 },
      { id: 10, nombre: 'McNuggets 6 pzs', precio: 85.00, imagen: '🍗', descripcion: 'Nuggets de pollo premium', tiempo: '4-5 min', rating: 4.6 },
      { id: 11, nombre: 'Aros de Cebolla', precio: 55.00, imagen: '🧅', descripcion: 'Aros de cebolla dorados', tiempo: '3-4 min', rating: 4.3 },
      { id: 12, nombre: 'Ensalada César', precio: 75.00, imagen: '🥗', descripcion: 'Lechuga, crutones, aderezo césar', tiempo: '2-3 min', rating: 4.2 }
    ],
    postres: [
      { id: 13, nombre: 'McFlurry Oreo', precio: 55.00, imagen: '🍦', descripcion: 'Helado con galletas Oreo', tiempo: '2-3 min', rating: 4.7 },
      { id: 14, nombre: 'Pay de Manzana', precio: 35.00, imagen: '🥧', descripcion: 'Pay de manzana caliente', tiempo: '1-2 min', rating: 4.5 },
      { id: 15, nombre: 'Sundae de Fresa', precio: 40.00, imagen: '🍓', descripcion: 'Helado con salsa de fresa', tiempo: '1-2 min', rating: 4.4 },
      { id: 16, nombre: 'Galletas', precio: 25.00, imagen: '🍪', descripcion: 'Galletas de chispas de chocolate', tiempo: '1 min', rating: 4.3 }
    ],
    desayunos: [
      { id: 17, nombre: 'McMuffin Huevo', precio: 65.00, imagen: '🥪', descripcion: 'Muffin inglés, huevo, queso, jamón', tiempo: '4-5 min', rating: 4.6 },
      { id: 18, nombre: 'Hotcakes', precio: 75.00, imagen: '🥞', descripcion: 'Hotcakes esponjosos con miel', tiempo: '5-6 min', rating: 4.8 },
      { id: 19, nombre: 'Hash Browns', precio: 35.00, imagen: '🥔', descripcion: 'Papas doradas en cuadritos', tiempo: '3-4 min', rating: 4.4 },
      { id: 20, nombre: 'Burrito Desayuno', precio: 85.00, imagen: '🌯', descripcion: 'Huevo, jamón, queso en tortilla', tiempo: '4-5 min', rating: 4.5 }
    ]
  };

  // Configuración MQTT
  useEffect(() => {
    client.subscribe("pedidos/estado");

    const mensajeHandler = (topic, message) => {
      if (topic === "pedidos/estado") {
        const { pedidoId: recibidoPedidoId, estado } = JSON.parse(message.toString());
        if (recibidoPedidoId === pedidoId) {
          setEstadoActual(estado);
          console.log(`📦 Estado actualizado: ${estado}`);
        }
      }
    };

    client.on("message", mensajeHandler);

    return () => {
      client.removeListener("message", mensajeHandler);
    };
  }, [pedidoId]);

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existente = prev.find(item => item.id === producto.id);
      if (existente) {
        return prev.map(item =>
          item.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad === 0) {
      setCarrito(prev => prev.filter(item => item.id !== id));
    } else {
      setCarrito(prev => 
        prev.map(item =>
          item.id === id ? { ...item, cantidad: nuevaCantidad } : item
        )
      );
    }
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const confirmarOrden = () => {
    // Validar que hay productos en el carrito
    if (carrito.length === 0) {
      alert("⚠️ Selecciona al menos un producto.");
      return;
    }

    // Crear el pedido con formato MQTT
    const nuevoPedidoId = Date.now();
    const pedidoMQTT = {
      id: nuevoPedidoId,
      estado: "En espera",
      alimentos: carrito.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        imagen: item.imagen
      })),
      total: calcularTotal(),
      timestamp: new Date().toISOString()
    };

    // Enviar pedido por MQTT
    client.publish("pedidos/nuevos", JSON.stringify(pedidoMQTT));
    console.log("📦 Pedido enviado:", pedidoMQTT);

    // Configurar estados para seguimiento
    setPedidoId(nuevoPedidoId);
    setEstadoActual("En espera");
    setMostrarConfirmacion(true);
    setMostrarProgreso(true);
    setMostrarCarrito(false);
  };

  const nuevaOrden = () => {
    setCarrito([]);
    setMostrarCarrito(false);
    setMostrarConfirmacion(false);
    setMostrarProgreso(false);
    setPedidoId(null);
    setEstadoActual("En espera");
  };

  const progresoPorEstado = {
    "En espera": "0%",
    "En preparación": "50%",
    "Listo": "100%"
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case "En espera": return "#fbbf24";
      case "En preparación": return "#3b82f6";
      case "Listo": return "#10b981";
      default: return "#6b7280";
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '0'
    },
    mainContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      color: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      margin: '0'
    },
    headerSubtitle: {
      fontSize: '1.125rem',
      opacity: '0.9',
      margin: '8px 0 0 0'
    },
    cartButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      padding: '12px 16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      position: 'relative',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    cartBadge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      backgroundColor: '#ef4444',
      color: 'white',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    categoriesPanel: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    },
    categoriesTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#1f2937'
    },
    categoryButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '8px',
      transition: 'all 0.3s ease',
      fontSize: '1rem'
    },
    categoryButtonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    categoryButtonInactive: {
      backgroundColor: '#f9fafb',
      color: '#374151'
    },
    productsPanel: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    productsTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#1f2937'
    },
    productCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    productHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    productEmoji: {
      fontSize: '2rem'
    },
    productName: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0'
    },
    productDescription: {
      color: '#6b7280',
      fontSize: '0.875rem',
      marginBottom: '12px'
    },
    productInfo: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px'
    },
    productInfoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    productFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    productPrice: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    addButton: {
      backgroundColor: '#ef4444',
      background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    modal: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      padding: '20px'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    },
    modalHeader: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px'
    },
    modalHeaderContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      margin: '0'
    },
    closeButton: {
      backgroundColor: 'transparent',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.25rem',
      transition: 'all 0.3s ease'
    },
    modalBody: {
      padding: '24px',
      maxHeight: '60vh',
      overflowY: 'auto'
    },
    emptyCart: {
      textAlign: 'center',
      padding: '40px 20px'
    },
    emptyCartIcon: {
      fontSize: '4rem',
      marginBottom: '16px'
    },
    emptyCartText: {
      color: '#6b7280',
      fontSize: '1.125rem'
    },
    cartItem: {
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e5e7eb'
    },
    cartItemHeader: {
      marginBottom: '12px'
    },
    cartItemInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    cartItemEmoji: {
      fontSize: '1.5rem'
    },
    cartItemName: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 4px 0'
    },
    cartItemPrice: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: '0'
    },
    cartItemControls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    quantityControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    quantityButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    quantityText: {
      fontSize: '1rem',
      fontWeight: 'bold',
      minWidth: '24px',
      textAlign: 'center'
    },
    itemTotal: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    totalSection: {
      borderTop: '2px solid #e5e7eb',
      paddingTop: '16px',
      marginBottom: '24px'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    totalAmount: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    confirmButton: {
      width: '100%',
      backgroundColor: '#10b981',
      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    confirmationContainer: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    confirmationCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      maxWidth: '600px',
      width: '100%',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      textAlign: 'center'
    },
    confirmationHeader: {
      marginBottom: '32px'
    },
    confirmationIcon: {
      fontSize: '4rem',
      marginBottom: '16px'
    },
    confirmationTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px'
    },
    confirmationSubtitle: {
      fontSize: '1.125rem',
      color: '#6b7280',
      margin: '0'
    },
    confirmationBody: {
      textAlign: 'left'
    },
    orderSummary: {
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    },
    orderSummaryTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '16px'
    },
    orderItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '12px',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '12px'
    },
    orderItemInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    orderItemDetails: {
      display: 'flex',
      flexDirection: 'column'
    },
    orderItemName: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: '0 0 4px 0'
    },
    orderItemQuantity: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: '0'
    },
    orderItemPrice: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    orderTotal: {
      borderTop: '2px solid #e5e7eb',
      paddingTop: '12px'
    },
    orderTotalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    orderTotalAmount: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    timeEstimate: {
      backgroundColor: '#eff6ff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    },
    timeEstimateHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    timeEstimateTitle: {
      fontSize: '1.125rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    timeEstimateText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: '0'
    },
    newOrderButton: {
      width: '100%',
      backgroundColor: '#10b981',
      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '1.125rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    // Nuevos estilos para el progreso
    progressSection: {
      backgroundColor: '#f0f9ff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px',
      border: '1px solid #e0f2fe'
    },
    progressHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px'
    },
    progressTitle: {
      fontSize: '1.125rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px'
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.5s ease',
      background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    progressText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      textAlign: 'center'
    }
  };

  if (mostrarConfirmacion) {
    return (
      <div style={styles.confirmationContainer}>
        <div style={styles.confirmationCard}>
          <div style={styles.confirmationHeader}>
            <div style={styles.confirmationIcon}>✅</div>
            <h1 style={styles.confirmationTitle}>¡Orden Confirmada!</h1>
            <p style={styles.confirmationSubtitle}>Tu pedido está siendo preparado</p>
          </div>
          
          <div style={styles.confirmationBody}>
            {/* Sección de progreso MQTT */}
            {mostrarProgreso && (
              <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                  <Clock color={getEstadoColor(estadoActual)} size={20} />
                  <span style={styles.progressTitle}>Estado: {estadoActual}</span>
                </div>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: progresoPorEstado[estadoActual] || "0%",
                      backgroundColor: getEstadoColor(estadoActual)
                    }}
                  ></div>
                </div>
                <p style={styles.progressText}>
                  {estadoActual === "En espera" && "Tu pedido está en cola de preparación"}
                  {estadoActual === "En preparación" && "Nuestros chefs están preparando tu pedido"}
                  {estadoActual === "Listo" && "¡Tu pedido está listo para recoger!"}
                </p>
              </div>
            )}

            <div style={styles.orderSummary}>
              <h3 style={styles.orderSummaryTitle}>
                <ChefHat color="#ef4444" size={20} />
                Resumen de tu orden
              </h3>
              {carrito.map((item, index) => (
                <div key={item.id} style={{
                  ...styles.orderItem,
                  ...(index === carrito.length - 1 ? {borderBottom: 'none'} : {})
                }}>
                  <div style={styles.orderItemInfo}>
                    <span style={{fontSize: '24px'}}>{item.imagen}</span>
                    <div style={styles.orderItemDetails}>
                      <p style={styles.orderItemName}>{item.nombre}</p>
                      <p style={styles.orderItemQuantity}>Cantidad: {item.cantidad}</p>
                    </div>
                  </div>
                  <p style={styles.orderItemPrice}>${(item.precio * item.cantidad).toFixed(2)}</p>
                </div>
              ))}
              
              <div style={styles.orderTotal}>
                <div style={styles.orderTotalRow}>
                  <span>Total a pagar:</span>
                  <span style={styles.orderTotalAmount}>${calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={styles.timeEstimate}>
              <div style={styles.timeEstimateHeader}>
                <Clock color="#3b82f6" size={20} />
                <span style={styles.timeEstimateTitle}>
                  {estadoActual === "Listo" ? "¡Tu pedido está listo!" : "Tiempo estimado: 8-12 minutos"}
                </span>
              </div>
              <p style={styles.timeEstimateText}>
                {estadoActual === "Listo" 
                  ? "Puedes pasar a recoger tu pedido" 
                  : "Te notificaremos cuando tu orden esté lista"
                }
              </p>
            </div>

            <button
              onClick={nuevaOrden}
              style={styles.newOrderButton}
              onMouseOver={(e) => e.target.style.background = 'linear-gradient(90deg, #059669 0%, #047857 100%)'}
              onMouseOut={(e) => e.target.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)'}
            >
              Nueva Orden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.headerTitle}>🍔 MenuMax</h1>
              <p style={styles.headerSubtitle}>Ordena fácil, come delicioso</p>
            </div>
            <button
              onClick={() => setMostrarCarrito(!mostrarCarrito)}
              style={styles.cartButton}
              onMouseOver={(e) => e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'}
              onMouseOut={(e) => e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
            >
              <ShoppingCart size={24} />
              {carrito.length > 0 && (
                <span style={styles.cartBadge}>
                  {carrito.reduce((total, item) => total + item.cantidad, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        <div style={window.innerWidth >= 1024 ? {
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px'
        } : {
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }}>
          {/* Panel de Categorías */}
          <div>
            <div style={styles.categoriesPanel}>
              <h2 style={styles.categoriesTitle}>Categorías</h2>
              <div>
                {categorias.map(categoria => (
                  <button
                    key={categoria.id}
                    onClick={() => setCategoriaActiva(categoria.id)}
                    style={{
                      ...styles.categoryButton,
                      ...(categoriaActiva === categoria.id ? styles.categoryButtonActive : styles.categoryButtonInactive)
                    }}
                    onMouseOver={(e) => {
                      if (categoriaActiva !== categoria.id) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (categoriaActiva !== categoria.id) {
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                  >
                    <span style={{fontSize: '24px'}}>{categoria.icono}</span>
                    <span>{categoria.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de Productos */}
          <div>
            <div style={styles.productsPanel}>
              <h2 style={styles.productsTitle}>
                {categorias.find(c => c.id === categoriaActiva)?.nombre}
              </h2>
              <div style={window.innerWidth >= 768 ? {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              } : {
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px'
              }}>
                {productos[categoriaActiva]?.map(producto => (
                  <div 
                    key={producto.id} 
                    style={styles.productCard}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={styles.productHeader}>
                      <div style={styles.productEmoji}>{producto.imagen}</div>
                      <h3 style={styles.productName}>{producto.nombre}</h3>
                    </div>
                    
                    <p style={styles.productDescription}>{producto.descripcion}</p>
                    
                    <div style={styles.productInfo}>
                      <div style={styles.productInfoItem}>
                        <Clock size={12} />
                        <span>{producto.tiempo}</span>
                      </div>
                      <div style={styles.productInfoItem}>
                        <Star size={12} color="#fbbf24" />
                        <span>{producto.rating}</span>
                      </div>
                    </div>
                    
                    <div style={styles.productFooter}>
                      <span style={styles.productPrice}>
                        ${producto.precio.toFixed(2)}
                      </span>
                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        style={styles.addButton}
                        onMouseOver={(e) => {
                          e.target.style.background = 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Carrito Modal */}
        {mostrarCarrito && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderContent}>
                  <h2 style={styles.modalTitle}>Tu Orden</h2>
                  <button
                    onClick={() => setMostrarCarrito(false)}
                    style={styles.closeButton}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div style={styles.modalBody}>
                {carrito.length === 0 ? (
                  <div style={styles.emptyCart}>
                    <div style={styles.emptyCartIcon}>🛒</div>
                    <p style={styles.emptyCartText}>Tu carrito está vacío</p>
                  </div>
                ) : (
                  <>
                    <div style={{marginBottom: '24px'}}>
                      {carrito.map(item => (
                        <div key={item.id} style={styles.cartItem}>
                          <div style={styles.cartItemHeader}>
                            <div style={styles.cartItemInfo}>
                              <span style={styles.cartItemEmoji}>{item.imagen}</span>
                              <div>
                                <h4 style={styles.cartItemName}>{item.nombre}</h4>
                                <p style={styles.cartItemPrice}>${item.precio.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          <div style={styles.cartItemControls}>
                            <div style={styles.quantityControls}>
                              <button
                                onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                style={styles.quantityButton}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                              >
                                <Minus size={16} />
                              </button>
                              <span style={styles.quantityText}>{item.cantidad}</span>
                              <button
                                onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                style={styles.quantityButton}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span style={styles.itemTotal}>
                              ${(item.precio * item.cantidad).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={styles.totalSection}>
                      <div style={styles.totalRow}>
                        <span>Total:</span>
                        <span style={styles.totalAmount}>${calcularTotal().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={confirmarOrden}
                      style={styles.confirmButton}
                      onMouseOver={(e) => {
                        e.target.style.background = 'linear-gradient(90deg, #059669 0%, #047857 100%)';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      Confirmar Orden
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuInteractivo;