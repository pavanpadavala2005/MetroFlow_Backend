
import pool from "../config/db.js";

// Find active metro lines connecting both stations
export const findCommonLines = async (
    sourceStationId,
    destinationStationId
) => {
    const [rows] = await pool.execute(
        `SELECT
            source_line.line_id,
            ml.line_name,
            ml.line_code,
            source_line.sequence_number AS source_sequence,
            destination_line.sequence_number AS destination_sequence
         FROM line_stations source_line

         JOIN line_stations destination_line
            ON source_line.line_id = destination_line.line_id

         JOIN metro_lines ml
            ON source_line.line_id = ml.id

         JOIN stations source_station
            ON source_line.station_id = source_station.id

         JOIN stations destination_station
            ON destination_line.station_id = destination_station.id

         WHERE source_line.station_id = ?
           AND destination_line.station_id = ?
           AND source_station.is_active = TRUE
           AND destination_station.is_active = TRUE
           AND ml.is_active = TRUE

         ORDER BY ml.id`,
        [sourceStationId, destinationStationId]
    );

    return rows;
};


// Get stations between two positions on a line
export const getStationsBetween = async (
    lineId,
    sourceSequence,
    destinationSequence
) => {
    const ascending = sourceSequence < destinationSequence;

    const [rows] = await pool.execute(
        `SELECT
            s.id,
            s.station_code,
            s.station_name,
            ls.sequence_number,
            ls.distance_from_origin_km

         FROM line_stations ls

         JOIN stations s
            ON ls.station_id = s.id

         WHERE ls.line_id = ?
           AND ls.sequence_number BETWEEN ? AND ?
           AND s.is_active = TRUE

         ORDER BY ls.sequence_number ${ascending ? "ASC" : "DESC"}`,
        [
            lineId,
            Math.min(sourceSequence, destinationSequence),
            Math.max(sourceSequence, destinationSequence)
        ]
    );

    return rows;
};
