
import pool from "../config/db.js";

// GET ALL ACTIVE TRAIN POSITIONS

export const getAllTrainPositions = async () => {
    const [rows] = await pool.execute(
        `SELECT
            t.id AS train_id,
            t.train_code,
            t.line_id,
            t.capacity,
            t.status AS train_status,

            tp.current_station_id,
            current_station.station_name AS current_station,

            tp.next_station_id,
            next_station.station_name AS next_station,

            tp.estimated_arrival_at,
            tp.status AS position_status,
            tp.updated_at

         FROM trains t

         JOIN train_positions tp
            ON t.id = tp.train_id

         JOIN stations current_station
            ON tp.current_station_id = current_station.id

         LEFT JOIN stations next_station
            ON tp.next_station_id = next_station.id

         WHERE t.status <> 'OUT_OF_SERVICE'
         ORDER BY t.train_code`
    );

    return rows;
};


// UPDATE TRAIN POSITION

export const updateTrainPosition = async (
    trainId,
    currentStationId,
    nextStationId,
    estimatedArrivalAt,
    status
) => {

    const [result] = await pool.execute(
        `UPDATE train_positions

         SET
            current_station_id = ?,
            next_station_id = ?,
            estimated_arrival_at = ?,
            status = ?

         WHERE train_id = ?`,
        [
            currentStationId,
            nextStationId,
            estimatedArrivalAt,
            status,
            trainId
        ]
    );

    return result.affectedRows > 0;
};


// GET POSITION OF ONE TRAIN

export const getTrainPositionById = async (trainId) => {

    const [rows] = await pool.execute(
        `SELECT
            t.id AS train_id,
            t.train_code,
            t.line_id,
            t.status AS train_status,

            tp.current_station_id,
            current_station.station_name AS current_station,

            tp.next_station_id,
            next_station.station_name AS next_station,

            tp.estimated_arrival_at,
            tp.status AS position_status

         FROM trains t

         JOIN train_positions tp
            ON t.id = tp.train_id

         JOIN stations current_station
            ON tp.current_station_id = current_station.id

         LEFT JOIN stations next_station
            ON tp.next_station_id = next_station.id

         WHERE t.id = ?
         LIMIT 1`,
        [trainId]
    );

    return rows[0] || null;
};


// GET STATIONS OF A METRO LINE

export const getStationsForTracking = async (lineId) => {

    const [rows] = await pool.execute(
        `SELECT
            ls.station_id,
            ls.sequence_number,
            s.station_name

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


// GET TRAINS FOR A LINE

export const getTrainsByLine = async (lineId) => {

    const [rows] = await pool.execute(
        `SELECT
            t.id AS train_id,
            t.train_code,
            t.line_id,
            t.status AS train_status,

            tp.current_station_id,
            tp.next_station_id,
            tp.estimated_arrival_at,
            tp.status AS position_status

         FROM trains t

         JOIN train_positions tp
            ON t.id = tp.train_id

         WHERE t.line_id = ?
           AND t.status <> 'OUT_OF_SERVICE'`,
        [lineId]
    );

    return rows;
};



export const getCommonLinesForJourney = async (
    sourceStationId,
    destinationStationId
) => {

    const [rows] = await pool.execute(
        `SELECT
            ml.id AS line_id,
            ml.line_name,
            ml.line_code,

            source.sequence_number AS source_sequence,
            destination.sequence_number AS destination_sequence

         FROM line_stations source

         JOIN line_stations destination
            ON source.line_id = destination.line_id

         JOIN metro_lines ml
            ON ml.id = source.line_id

         JOIN stations source_station
            ON source.station_id = source_station.id

         JOIN stations destination_station
            ON destination.station_id = destination_station.id

         WHERE source.station_id = ?
           AND destination.station_id = ?
           AND source_station.is_active = TRUE
           AND destination_station.is_active = TRUE
           AND ml.is_active = TRUE`,
        [sourceStationId, destinationStationId]
    );

    return rows;
};
