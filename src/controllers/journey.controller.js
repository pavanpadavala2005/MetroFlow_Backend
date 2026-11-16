
import journeyService from "../services/journey.service.js";

const validateScanRequest = (body) => {
    const ticketId = Number(body.ticketId);
    const stationId = Number(body.stationId);
    const token = body.token;

    if (
        !Number.isSafeInteger(ticketId) ||
        ticketId <= 0
    ) {
        return {
            error: "Valid ticket ID is required"
        };
    }

    if (
        !Number.isSafeInteger(stationId) ||
        stationId <= 0
    ) {
        return {
            error: "Valid station ID is required"
        };
    }

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return {
            error: "Valid QR token is required"
        };
    }

    return {
        ticketId,
        stationId,
        token
    };
};

export const scanEntry = async (req, res, next) => {
    try {
        const input = validateScanRequest(req.body);

        if (input.error) {
            return res.status(400).json({
                success: false,
                message: input.error
            });
        }

        const result = await journeyService.scanEntry(input);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Entry scanning failed"
        });
    }
};

export const scanExit = async (req, res, next) => {
    try {
        const input = validateScanRequest(req.body);

        if (input.error) {
            return res.status(400).json({
                success: false,
                message: input.error
            });
        }

        const result = await journeyService.scanExit(input);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Exit scanning failed"
        });
    }
};

export const getMyJourneys = async (req, res, next) => {
    try {
        const journeys = await journeyService.getMyJourneys(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            count: journeys.length,
            data: journeys
        });
    } catch (error) {
        next(error);
    }
};
