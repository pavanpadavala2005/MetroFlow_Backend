
import pool from "../config/db.js";

const Journey = {
    async executeTransaction(callback) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const result = await callback(connection);

            await connection.commit();

            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async getPassengerJourneys(userId) {
        const [rows] = await pool.execute(
            `SELECT
                j.id AS journey_id,
                j.ticket_id,
                t.ticket_code,
                source.station_name AS entry_station,
                destination.station_name AS exit_station,
                j.entry_time,
                j.exit_time,
                j.status,
                t.fare
            FROM journeys j
            JOIN tickets t
                ON j.ticket_id = t.id
            JOIN stations source
                ON j.entry_station_id = source.id
            JOIN stations destination
                ON t.destination_station_id = destination.id
            WHERE t.user_id = ?
            ORDER BY j.entry_time DESC`,
            [userId]
        );

        return rows;
    },

    async getJourneyByTicketId(ticketId) {
        const [rows] = await pool.execute(
            `SELECT *
            FROM journeys
            WHERE ticket_id = ?`,
            [ticketId]
        );

        return rows[0] || null;
    }
};

export default Journey;
