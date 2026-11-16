
import pool from "../config/db.js";
// GET ALL TRAINS
export const getAllTrains = async () => {

    const [rows] = await pool.execute(
        `SELECT
            t.id,
            t.train_code,
            t.line_id,
            ml.line_name,
            t.capacity,
            t.status,
            t.created_at

         FROM trains t

         JOIN metro_lines ml
            ON t.line_id = ml.id

         WHERE ml.is_active = TRUE

         ORDER BY t.train_code`
    );

    return rows;
};

// GET TRAIN BY ID
export const getTrainById = async (id) => {

    const [rows] = await pool.execute(
        `SELECT
            t.id,
            t.train_code,
            t.line_id,
            ml.line_name,
            t.capacity,
            t.status

         FROM trains t

         JOIN metro_lines ml
            ON t.line_id = ml.id

         WHERE t.id = ?`,
        [id]
    );

    return rows[0] || null;
};

// CREATE TRAIN + INITIAL POSITION
export const createTrain = async (data) => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        // Get the first two active stations
        const [stations] = await connection.execute(
            `SELECT
                ls.station_id,
                ls.sequence_number

             FROM line_stations ls

             JOIN stations s
                ON ls.station_id = s.id

             WHERE ls.line_id = ?
               AND s.is_active = TRUE

             ORDER BY ls.sequence_number
             LIMIT 2`,
            [data.line_id]
        );

        if (stations.length < 2) {

            const error = new Error(
                "The metro line must have at least two active stations"
            );

            error.status = 400;

            throw error;
        }

        // Insert train
        const [trainResult] = await connection.execute(
            `INSERT INTO trains
            (
                train_code,
                line_id,
                capacity,
                status
            )
            VALUES (?, ?, ?, ?)`,
            [
                data.train_code,
                data.line_id,
                data.capacity,
                "RUNNING"
            ]
        );

        const trainId = trainResult.insertId;

        // Initialize position
        await connection.execute(
            `INSERT INTO train_positions
            (
                train_id,
                current_station_id,
                next_station_id,
                estimated_arrival_at,
                status
            )
            VALUES (
                ?,
                ?,
                ?,
                DATE_ADD(NOW(), INTERVAL 30 SECOND),
                'MOVING'
            )`,
            [
                trainId,
                stations[0].station_id,
                stations[1].station_id
            ]
        );

        await connection.commit();

        return trainId;

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
};

// UPDATE TRAIN CAPACITY
export const updateTrain = async (id, data) => {

    const [result] = await pool.execute(
        `UPDATE trains
         SET capacity = ?
         WHERE id = ?`,
        [data.capacity, id]
    );

    return result.affectedRows > 0;
};

// UPDATE TRAIN STATUS
export const updateTrainStatus = async (id, status) => {

    const [result] = await pool.execute(
        `UPDATE trains
         SET status = ?
         WHERE id = ?`,
        [status, id]
    );

    return result.affectedRows > 0;
};
