
import pool from "../config/db.js";

// Get all active lines
export const getAllLines = async () => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM metro_lines
         WHERE is_active = TRUE
         ORDER BY line_name`
    );

    return rows;
};


// Get line by ID
export const getLineById = async (id) => {
    const [rows] = await pool.execute(
        `SELECT *
         FROM metro_lines
         WHERE id = ? AND is_active = TRUE`,
        [id]
    );

    return rows[0] || null;
};


// Create line
export const createLine = async (data) => {
    const [result] = await pool.execute(
        `INSERT INTO metro_lines
        (line_code, line_name, color)
        VALUES (?, ?, ?)`,
        [
            data.line_code,
            data.line_name,
            data.color || null
        ]
    );

    return result.insertId;
};


// Get stations belonging to a line
export const getLineStations = async (lineId) => {
    const [rows] = await pool.execute(
        `SELECT
            s.id,
            s.station_code,
            s.station_name,
            s.address,
            s.latitude,
            s.longitude,
            ls.sequence_number,
            ls.distance_from_origin_km
         FROM line_stations ls
         JOIN stations s
            ON ls.station_id = s.id
         WHERE ls.line_id = ?
           AND s.is_active = TRUE
         ORDER BY ls.sequence_number`,
        [lineId]
    );

    return rows;
};


// Add station to line
export const addStationToLine = async (
    lineId,
    stationId,
    sequenceNumber,
    distance
) => {
    const [result] = await pool.execute(
        `INSERT INTO line_stations
        (
            line_id,
            station_id,
            sequence_number,
            distance_from_origin_km
        )
        VALUES (?, ?, ?, ?)`,
        [
            lineId,
            stationId,
            sequenceNumber,
            distance ?? null
        ]
    );

    return result.insertId;
};
