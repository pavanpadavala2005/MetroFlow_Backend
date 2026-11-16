
import crypto from "node:crypto";

import Ticket from "../models/ticket.model.js";

import {
    generateQrToken,
    hashQrToken,
    generateQrCode
} from "../utils/qr.util.js";

const BASE_FARE = 10;
const FARE_PER_KM = 2;
const TICKET_VALIDITY_HOURS = 2;

// Demo fare calculation.
// Minimum fare: Rs. 10.
// Final fare is rounded up to the next Rs. 5.
const calculateFare = (distanceKm) => {
    const calculatedFare = BASE_FARE + (distanceKm * FARE_PER_KM);

    return Math.max(
        BASE_FARE,
        Math.ceil(calculatedFare / 5) * 5
    );
};

const bookTicket = async (
    userId,
    sourceStationId,
    destinationStationId
) => {
    if (sourceStationId === destinationStationId) {
        throw new Error("Source and destination stations must be different");
    }

    const route = await Ticket.getFareDistance(
        sourceStationId,
        destinationStationId
    );

    if (!route) {
        throw new Error(
            "No direct route available between these stations"
        );
    }

    const distanceKm = Number(route.distance_km);

    const fare = calculateFare(distanceKm);

    const validUntil = new Date(
        Date.now() + TICKET_VALIDITY_HOURS * 60 * 60 * 1000
    );

    const ticketCode = `MF-${crypto.randomUUID()
        .replaceAll("-", "")
        .toUpperCase()}`;

    const result = await Ticket.createTicketTransaction(
        async (connection) => {
            // First insert the ticket with a temporary hash.
            // We need the generated ticket ID to create its QR token.
            const [insertResult] = await connection.execute(
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
                    "0".repeat(64),
                    userId,
                    sourceStationId,
                    destinationStationId,
                    fare,
                    validUntil
                ]
            );

            const ticket = {
                id: insertResult.insertId,
                ticket_code: ticketCode,
                user_id: userId,
                valid_until: validUntil
            };

            const qrToken = generateQrToken(ticket);
            const qrTokenHash = hashQrToken(qrToken);

            await connection.execute(
                `UPDATE tickets
                SET qr_token_hash = ?
                WHERE id = ?`,
                [qrTokenHash, ticket.id]
            );

            return {
                ticket,
                qrToken
            };
        }
    );

    const [savedTicket] = await Ticket.getUserTickets(userId)
        .then(rows => rows.filter(
            item => item.ticket_code === ticketCode
        ));

    if (!savedTicket) {
        throw new Error("Ticket was created but could not be retrieved");
    }

    const qrCode = await generateQrCode(
        result.ticket,
        result.qrToken
    );

    return {
        ticket: savedTicket,
        distanceKm,
        qrCode
    };
};

const getMyTickets = async (userId) => {
    return await Ticket.getUserTickets(userId);
};

const getMyTicket = async (ticketId, userId) => {
    const ticket = await Ticket.getTicketById(ticketId, userId);

    if (!ticket) {
        throw new Error("Ticket not found");
    }

    return ticket;
};

const getTicketQr = async (ticketId, userId) => {
    const ticket = await Ticket.getTicketForQr(ticketId, userId);

    if (!ticket) {
        throw new Error("Ticket not found");
    }

    if (ticket.status !== "BOOKED") {
        throw new Error("QR code is not available for this ticket");
    }

    if (new Date(ticket.valid_until) <= new Date()) {
        throw new Error("Ticket has expired");
    }

    const token = generateQrToken(ticket);
    const calculatedHash = hashQrToken(token);

    if (calculatedHash !== ticket.qr_token_hash) {
        throw new Error("Invalid ticket QR credentials");
    }

    return await generateQrCode(ticket, token);
};

const cancelMyTicket = async (ticketId, userId) => {
    const cancelled = await Ticket.cancelTicket(ticketId, userId);

    if (!cancelled) {
        throw new Error(
            "Ticket cannot be cancelled. It may already be used, expired or cancelled."
        );
    }

    return {
        message: "Ticket cancelled successfully"
    };
};

export default {
    bookTicket,
    getMyTickets,
    getMyTicket,
    getTicketQr,
    cancelMyTicket
};
