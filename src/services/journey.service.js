
import crypto from "node:crypto";

import Journey from "../models/journey.model.js";

import {
    generateQrToken,
    hashQrToken
} from "../utils/qr.util.js";

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Compare hashes without a normal string comparison.
const verifyQrToken = (ticket, scannedToken) => {
    if (
        typeof scannedToken !== "string" ||
        !/^[a-f0-9]{64}$/i.test(scannedToken)
    ) {
        return false;
    }

    const expectedToken = generateQrToken(ticket);
    const expectedHash = hashQrToken(expectedToken);

    const storedHash = ticket.qr_token_hash;

    if (
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/i.test(storedHash)
    ) {
        return false;
    }

    const expectedBuffer = Buffer.from(expectedHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    return crypto.timingSafeEqual(
        expectedBuffer,
        storedBuffer
    ) &&
    crypto.timingSafeEqual(
        Buffer.from(scannedToken, "hex"),
        Buffer.from(expectedToken, "hex")
    );
};

const scanEntry = async ({
    ticketId,
    token,
    stationId
}) => {
    return await Journey.executeTransaction(async (connection) => {

        // Lock the ticket while validating and processing entry.
        const [tickets] = await connection.execute(
            `SELECT
                id,
                ticket_code,
                user_id,
                qr_token_hash,
                source_station_id,
                destination_station_id,
                fare,
                status,
                valid_until
            FROM tickets
            WHERE id = ?
            FOR UPDATE`,
            [ticketId]
        );

        const ticket = tickets[0];

        if (!ticket) {
            throw createError("Ticket not found", 404);
        }

        // Validate QR token.
        if (!verifyQrToken(ticket, token)) {
            throw createError("Invalid QR code", 401);
        }

        // Validate ticket status.
        if (ticket.status !== "BOOKED") {
            throw createError(
                `Ticket cannot be used for entry. Current status: ${ticket.status}`
            );
        }

        // Validate expiry.
        if (new Date(ticket.valid_until) <= new Date()) {
            await connection.execute(
                `UPDATE tickets
                SET status = 'EXPIRED'
                WHERE id = ? AND status = 'BOOKED'`,
                [ticket.id]
            );

            throw createError("Ticket has expired");
        }

        // Entry must be at the booked source station.
        if (Number(ticket.source_station_id) !== stationId) {
            throw createError(
                "Invalid entry station. Please use your source station."
            );
        }

        // Create a journey record.
        const [journeyResult] = await connection.execute(
            `INSERT INTO journeys
            (
                ticket_id,
                entry_station_id,
                entry_time,
                status
            )
            VALUES (?, ?, NOW(), 'IN_PROGRESS')`,
            [ticket.id, stationId]
        );

        // Update ticket status.
        await connection.execute(
            `UPDATE tickets
            SET status = 'IN_PROGRESS'
            WHERE id = ?`,
            [ticket.id]
        );

        return {
            journeyId: journeyResult.insertId,
            ticketId: ticket.id,
            ticketCode: ticket.ticket_code,
            entryStationId: stationId,
            status: "IN_PROGRESS",
            message: "Entry successful. Journey started."
        };
    });
};

const scanExit = async ({
    ticketId,
    token,
    stationId
}) => {
    return await Journey.executeTransaction(async (connection) => {

        // Lock the ticket to prevent simultaneous exit scans.
        const [tickets] = await connection.execute(
            `SELECT
                id,
                ticket_code,
                user_id,
                qr_token_hash,
                source_station_id,
                destination_station_id,
                fare,
                status,
                valid_until
            FROM tickets
            WHERE id = ?
            FOR UPDATE`,
            [ticketId]
        );

        const ticket = tickets[0];

        if (!ticket) {
            throw createError("Ticket not found", 404);
        }

        if (!verifyQrToken(ticket, token)) {
            throw createError("Invalid QR code", 401);
        }

        if (ticket.status !== "IN_PROGRESS") {
            throw createError(
                "No active journey found for this ticket"
            );
        }

        // Exit must happen at the booked destination station.
        if (Number(ticket.destination_station_id) !== stationId) {
            throw createError(
                "Invalid exit station. Please use your destination station."
            );
        }

        const [journeys] = await connection.execute(
            `SELECT
                id,
                ticket_id,
                entry_station_id,
                entry_time,
                status
            FROM journeys
            WHERE ticket_id = ?
            FOR UPDATE`,
            [ticket.id]
        );

        const journey = journeys[0];

        if (!journey || journey.status !== "IN_PROGRESS") {
            throw createError("Active journey not found");
        }

        // Complete the journey.
        await connection.execute(
            `UPDATE journeys
            SET
                exit_station_id = ?,
                exit_time = NOW(),
                status = 'COMPLETED'
            WHERE id = ?`,
            [stationId, journey.id]
        );

        // Complete the ticket.
        await connection.execute(
            `UPDATE tickets
            SET status = 'COMPLETED'
            WHERE id = ?`,
            [ticket.id]
        );

        return {
            journeyId: journey.id,
            ticketId: ticket.id,
            ticketCode: ticket.ticket_code,
            entryStationId: journey.entry_station_id,
            exitStationId: stationId,
            status: "COMPLETED",
            message: "Exit successful. Journey completed."
        };
    });
};

const getMyJourneys = async (userId) => {
    return await Journey.getPassengerJourneys(userId);
};

export default {
    scanEntry,
    scanExit,
    getMyJourneys
};
