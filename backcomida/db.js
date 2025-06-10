import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "definitovo-db",  
    user: "root",           // ✅ Usar root (más confiable en Docker)
    password: "1234",       
    database: "pedidos_db", 
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Función para probar la conexión con reintentos
export const testConnection = async (maxRetries = 5, delay = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const connection = await pool.getConnection();
            console.log("✅ Conectado a MySQL exitosamente");
            console.log(`📊 Usuario: comida_user | Base: pedidos_db | Host: definitovo-db`);
            connection.release();
            return true;
        } catch (error) {
            console.error(`❌ Intento ${i + 1}/${maxRetries} - Error conectando a MySQL:`, error.message);
            if (i < maxRetries - 1) {
                console.log(`⏳ Reintentando en ${delay/1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
};

// Probar conexión al iniciar con reintentos
testConnection();

export default pool;