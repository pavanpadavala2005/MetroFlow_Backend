
import crypto from "node:crypto";
import QRCode from "qrcode";

const QR_SECRET = process.env.JWT_SECRET;

if (!QR_SECRET) {
    throw new Error("JWT_SECRET is required for QR token generation");
}

// Generate a deterministic, signed token for a particular ticket.
// This allows us to regenerate the QR code without storing the raw token.
export const generateQrToken = (ticket) => {
    const payload = [
        ticket.id,
        ticket.ticket_code,
        ticket.user_id
    ].join("|");

    return crypto
        .createHmac("sha256", QR_SECRET)
        .update(payload)
        .digest("hex");
};

export const hashQrToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

export const generateQrCode = async (ticket, token) => {
    const qrPayload = JSON.stringify({
        type: "METROFLOW_TICKET",
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        token
    });

    return QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        width: 300,
        margin: 2
    });
};
