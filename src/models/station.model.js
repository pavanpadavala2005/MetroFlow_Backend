
import pool from "../config/db.js";

// Get all active stations
export const getAllStations = async () => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM stations
         WHERE is_active = TRUE
         ORDER BY station_name`
    );

    return rows;
};


// Get station by ID
export const getStationById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM stations
         WHERE id = ? AND is_active = TRUE`,
        [id]
    );

    return rows[0] || null;
};


// Create station
export const createStation = async (data) => {
    const {
        station_code,
        station_name,
        address,
        latitude,
        longitude
    } = data;

    const [result] = await pool.execute(
        `INSERT INTO stations
        (
            station_code,
            station_name,
            address,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            station_code,
            station_name,
            address || null,
            latitude ?? null,
            longitude ?? null
        ]
    );

    return result.insertId;
};


// Update station
export const updateStation = async (id, data) => {
    const {
        station_name,
        address,
        latitude,
        longitude
    } = data;

    const [result] = await pool.execute(
        `UPDATE stations
         SET station_name = ?,
             address = ?,
             latitude = ?,
             longitude = ?
         WHERE id = ? AND is_active = TRUE`,
        [
            station_name,
            address ?? null,
            latitude ?? null,
            longitude ?? null,
            id
        ]
    );

    return result.affectedRows > 0;
};


// Deactivate station
export const deactivateStation = async (id) => {
    const [result] = await pool.execute(
        `UPDATE stations
         SET is_active = FALSE
         WHERE id = ? AND is_active = TRUE`,
        [id]
    );

    return result.affectedRows > 0;
};
