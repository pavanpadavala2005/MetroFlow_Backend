
import pool from "../config/db.js";

const Ticket = {
    async createTicket(ticketData, connection) {
        const {
            ticketCode,
            qrTokenHash,
            userId,
            sourceStationId,
            destinationStationId,
            fare,
            validUntil
        } = ticketData;

        const [result] = await connection.execute(
            `INSERT INTO tickets
            (
                ticket_code,
                qr_token_hash,
                user_id,
                source_station_id,
                destination_station_id,
                fare,
                status,
                valid_until
            )
            VALUES (?, ?, ?, ?, ?, ?, 'BOOKED', ?)`,
            [
                ticketCode,
                qrTokenHash,
                userId,
                sourceStationId,
                destinationStationId,
                fare,
                validUntil
            ]
        );

        return result.insertId;
    },

    async getTicketById(ticketId, userId) {
        const [rows] = await pool.execute(
            `SELECT
                t.id,
                t.ticket_code,
                t.user_id,
                t.source_station_id,
                t.destination_station_id,
                t.fare,
                t.status,
                t.booked_at,
                t.valid_until,
                source.station_name AS source_station,
                destination.station_name AS destination_station
            FROM tickets t
            JOIN stations source
                ON t.source_station_id = source.id
            JOIN stations destination
                ON t.destination_station_id = destination.id
            WHERE t.id = ? AND t.user_id = ?`,
            [ticketId, userId]
        );

        return rows[0] || null;
    },

    async getTicketForQr(ticketId, userId) {
        const [rows] = await pool.execute(
            `SELECT
                id,
                ticket_code,
                user_id,
                qr_token_hash,
                valid_until,
                status
            FROM tickets
            WHERE id = ? AND user_id = ?`,
            [ticketId, userId]
        );

        return rows[0] || null;
    },

    async getUserTickets(userId) {
        const [rows] = await pool.execute(
            `SELECT
                t.id,
                t.ticket_code,
                t.fare,
                t.status,
                t.booked_at,
                t.valid_until,
                source.station_name AS source_station,
                destination.station_name AS destination_station
            FROM tickets t
            JOIN stations source
                ON t.source_station_id = source.id
            JOIN stations destination
                ON t.destination_station_id = destination.id
            WHERE t.user_id = ?
            ORDER BY t.booked_at DESC`,
            [userId]
        );

        return rows;
    },

    async cancelTicket(ticketId, userId) {
        const [result] = await pool.execute(
            `UPDATE tickets
            SET status = 'CANCELLED'
            WHERE id = ?
            AND user_id = ?
            AND status = 'BOOKED'
            AND valid_until > NOW()`,
            [ticketId, userId]
        );

        return result.affectedRows > 0;
    },

    async getFareDistance(sourceStationId, destinationStationId) {
        const [rows] = await pool.execute(
            `SELECT
                ls1.line_id,
                ABS(
                    ls1.distance_from_origin_km -
                    ls2.distance_from_origin_km
                ) AS distance_km
            FROM line_stations ls1
            JOIN line_stations ls2
                ON ls1.line_id = ls2.line_id
            JOIN metro_lines ml
                ON ml.id = ls1.line_id
            JOIN stations source
                ON source.id = ls1.station_id
            JOIN stations destination
                ON destination.id = ls2.station_id
            WHERE ls1.station_id = ?
            AND ls2.station_id = ?
            AND ml.is_active = TRUE
            AND source.is_active = TRUE
            AND destination.is_active = TRUE
            LIMIT 1`,
            [sourceStationId, destinationStationId]
        );

        return rows[0] || null;
    },

    async createTicketTransaction(callback) {
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
    }
};

export default Ticket;
