
import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
export const connectDatabase = async () => {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("MySQL Database Connected Successfully!");

    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export default pool;





