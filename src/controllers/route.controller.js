
import { findJourneyRoute } from "../services/route.service.js";

export const getJourneyRoute = async (req, res, next) => {
    try {
        const sourceStationId = Number(req.query.sourceStationId);
        const destinationStationId = Number(req.query.destinationStationId);

        if (
            !Number.isSafeInteger(sourceStationId) ||
            sourceStationId <= 0 ||
            !Number.isSafeInteger(destinationStationId) ||
            destinationStationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid sourceStationId and destinationStationId are required"
            });
        }

        const route = await findJourneyRoute(
            sourceStationId,
            destinationStationId
        );

        res.status(200).json({
            success: true,
            message: "Journey route found successfully",
            data: { route }
        });

    } catch (error) {
        next(error);
    }
};
