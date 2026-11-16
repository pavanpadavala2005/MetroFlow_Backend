
import express from "express";

import {
    bookTicket,
    getMyTickets,
    getMyTicket,
    getTicketQr,
    cancelTicket
} from "../controllers/ticket.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All ticket endpoints require passenger authentication.
router.use(authenticate);

// Book a new ticket.
router.post("/book", bookTicket);

// Get logged-in passenger's ticket history.
router.get("/my", getMyTickets);

// Get one ticket.
router.get("/:ticketId", getMyTicket);

// Regenerate ticket QR code.
router.get("/:ticketId/qr", getTicketQr);

// Cancel a ticket.
router.patch("/:ticketId/cancel", cancelTicket);

export default router;
