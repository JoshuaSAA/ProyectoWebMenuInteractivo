import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./mqttClient.js"; // Importar para inicializar MQTT

// Render moderno con React 18/19
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);