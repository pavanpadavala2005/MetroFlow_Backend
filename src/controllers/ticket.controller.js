
import ticketService from "../services/ticket.service.js";

export const bookTicket = async (req, res, next) => {
    try {
        const { sourceStationId, destinationStationId } = req.body;

        const sourceId = Number(sourceStationId);
        const destinationId = Number(destinationStationId);

        if (
            !Number.isSafeInteger(sourceId) ||
            !Number.isSafeInteger(destinationId) ||
            sourceId <= 0 ||
            destinationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid source and destination station IDs are required"
            });
        }

        const result = await ticketService.bookTicket(
            req.user.id,
            sourceId,
            destinationId
        );

        return res.status(201).json({
            success: true,
            message: "Ticket booked successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getMyTickets = async (req, res, next) => {
    try {
        const tickets = await ticketService.getMyTickets(req.user.id);

        return res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

export const getMyTicket = async (req, res, next) => {
    try {
        const ticketId = Number(req.params.ticketId);

        if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }

        const ticket = await ticketService.getMyTicket(
            ticketId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketQr = async (req, res, next) => {
    try {
        const ticketId = Number(req.params.ticketId);

        if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }

        const qrCode = await ticketService.getTicketQr(
            ticketId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "QR code generated successfully",
            data: {
                qrCode
            }
        });
    } catch (error) {
        next(error);
    }
};

export const cancelTicket = async (req, res, next) => {
    try {
        const ticketId = Number(req.params.ticketId);

        if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID"
            });
        }

        const result = await ticketService.cancelMyTicket(
            ticketId,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};
