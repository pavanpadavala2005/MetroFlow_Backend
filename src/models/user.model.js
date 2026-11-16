
import pool from "../config/db.js";

// Find user using email
export const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return rows[0] || null;
};


// Create a new user
export const createUser = async (userData) => {
    const {
        full_name,
        email,
        phone,
        password_hash
    } = userData;

    const [result] = await pool.execute(
        `INSERT INTO users
        (full_name, email, phone, password_hash)
        VALUES (?, ?, ?, ?)`,
        [
            full_name,
            email,
            phone || null,
            password_hash
        ]
    );

    return result.insertId;
};


// Find user using ID
export const findUserById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            full_name,
            email,
            phone,
            role,
            account_status,
            created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
};
