
import {
    fetchAllTrainPositions,
    fetchTrainPosition,
    fetchUpcomingTrains
} from "../services/tracking.service.js";

const parseId = (value) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error("Invalid ID");
        error.status = 400;
        throw error;
    }

    return id;
};


// GET ALL TRAIN POSITIONS

export const getAllPositions = async (req, res, next) => {
    try {

        const positions = await fetchAllTrainPositions();

        res.status(200).json({
            success: true,
            count: positions.length,
            data: { positions }
        });

    } catch (error) {
        next(error);
    }
};


// GET ONE TRAIN POSITION

export const getPositionByTrainId = async (req, res, next) => {
    try {

        const trainId = parseId(req.params.trainId);

        const position = await fetchTrainPosition(trainId);

        res.status(200).json({
            success: true,
            data: { position }
        });

    } catch (error) {
        next(error);
    }
};


// GET UPCOMING TRAINS

export const getUpcomingTrains = async (req, res, next) => {
    try {

        const sourceStationId = parseId(
            req.query.sourceStationId
        );

        const destinationStationId = parseId(
            req.query.destinationStationId
        );

        const result = await fetchUpcomingTrains(
            sourceStationId,
            destinationStationId
        );

        res.status(200).json({
            success: true,
            message: "Upcoming trains fetched successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};
