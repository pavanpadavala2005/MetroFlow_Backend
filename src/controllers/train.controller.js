
import * as TrainService from "../services/train.service.js";

const parseId = (value) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error("Invalid train ID");
        error.status = 400;
        throw error;
    }

    return id;
};

const VALID_STATUSES = [
    "RUNNING",
    "IDLE",
    "DELAYED",
    "OUT_OF_SERVICE"
];


// GET ALL TRAINS
export const getTrains = async (req, res, next) => {
    try {
        const trains = await TrainService.fetchTrains();

        res.status(200).json({
            success: true,
            count: trains.length,
            data: { trains }
        });

    } catch (error) {
        next(error);
    }
};


// GET TRAIN BY ID
export const getTrain = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        const train = await TrainService.fetchTrainById(id);

        res.status(200).json({
            success: true,
            data: { train }
        });

    } catch (error) {
        next(error);
    }
};


// CREATE TRAIN
export const createTrain = async (req, res, next) => {
    try {
        const {
            train_code,
            line_id,
            capacity
        } = req.body;

        if (
            typeof train_code !== "string" ||
            !train_code.trim() ||
            train_code.trim().length > 30
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid train code is required"
            });
        }

        const lineId = Number(line_id);
        const trainCapacity = Number(capacity);

        if (!Number.isSafeInteger(lineId) || lineId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid line ID is required"
            });
        }

        if (!Number.isSafeInteger(trainCapacity) || trainCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Train capacity must be a positive integer"
            });
        }

        const id = await TrainService.addTrain({
            train_code: train_code.trim().toUpperCase(),
            line_id: lineId,
            capacity: trainCapacity
        });

        res.status(201).json({
            success: true,
            message: "Train created successfully",
            data: { id }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Train code already exists"
            });
        }

        next(error);
    }
};


// UPDATE TRAIN
export const updateTrain = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const capacity = Number(req.body.capacity);

        if (
            !Number.isSafeInteger(capacity) ||
            capacity <= 0 ||
            req.body.capacity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid train capacity is required"
            });
        }

        const train = await TrainService.modifyTrain(id, {
            capacity
        });

        res.status(200).json({
            success: true,
            message: "Train updated successfully",
            data: { train }
        });

    } catch (error) {
        next(error);
    }
};


// UPDATE TRAIN STATUS
export const updateTrainStatus = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid train status",
                allowedStatuses: VALID_STATUSES
            });
        }

        const train = await TrainService.changeTrainStatus(
            id,
            status
        );

        res.status(200).json({
            success: true,
            message: "Train status updated successfully",
            data: { train }
        });

    } catch (error) {
        next(error);
    }
};
