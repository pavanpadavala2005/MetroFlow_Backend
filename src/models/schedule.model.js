
import pool from "../config/db.js";

// Get schedules for a train
export const getSchedulesByTrainId = async (trainId) => {
    const [rows] = await pool.execute(
        `SELECT
            ts.id,
            ts.train_id,
            t.train_code,
            ts.origin_station_id,
            source.station_name AS origin_station,
            ts.destination_station_id,
            destination.station_name AS destination_station,
            ts.departure_time,
            ts.arrival_time,
            ts.service_days,
            ts.is_active
         FROM train_schedules ts
         JOIN trains t
            ON ts.train_id = t.id
         JOIN stations source
            ON ts.origin_station_id = source.id
         JOIN stations destination
            ON ts.destination_station_id = destination.id
         WHERE ts.train_id = ?
           AND ts.is_active = TRUE
         ORDER BY ts.departure_time`,
        [trainId]
    );

    return rows;
};


// Create schedule
export const createSchedule = async (trainId, data) => {
    const [result] = await pool.execute(
        `INSERT INTO train_schedules
        (
            train_id,
            origin_station_id,
            destination_station_id,
            departure_time,
            arrival_time,
            service_days
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            trainId,
            data.origin_station_id,
            data.destination_station_id,
            data.departure_time,
            data.arrival_time,
            data.service_days || "MON,TUE,WED,THU,FRI,SAT,SUN"
        ]
    );

    return result.insertId;
};
