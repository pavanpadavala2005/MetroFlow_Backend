
import * as LineService from "../services/line.service.js";

const parseId = (value) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error("Invalid ID");
        error.status = 400;
        throw error;
    }

    return id;
};


// GET ALL LINES
export const getLines = async (req, res, next) => {
    try {
        const lines = await LineService.fetchLines();

        res.status(200).json({
            success: true,
            count: lines.length,
            data: { lines }
        });

    } catch (error) {
        next(error);
    }
};


// GET LINE BY ID
export const getLine = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        const line = await LineService.fetchLineById(id);

        res.status(200).json({
            success: true,
            data: { line }
        });

    } catch (error) {
        next(error);
    }
};


// CREATE LINE
export const createLine = async (req, res, next) => {
    try {
        const { line_code, line_name, color } = req.body;

        if (
            typeof line_code !== "string" ||
            typeof line_name !== "string" ||
            !line_code.trim() ||
            !line_name.trim() ||
            line_code.trim().length > 20 ||
            line_name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid line code and line name are required"
            });
        }

        const id = await LineService.addLine({
            line_code: line_code.trim().toUpperCase(),
            line_name: line_name.trim(),
            color: color?.trim() || null
        });

        res.status(201).json({
            success: true,
            message: "Metro line created successfully",
            data: { id }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Line code already exists"
            });
        }

        next(error);
    }
};


// GET STATIONS OF A LINE
export const getLineStations = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        const stations = await LineService.fetchLineStations(id);

        res.status(200).json({
            success: true,
            count: stations.length,
            data: { stations }
        });

    } catch (error) {
        next(error);
    }
};


// ADD STATION TO LINE
export const addStationToLine = async (req, res, next) => {
    try {
        const lineId = parseId(req.params.id);

        const {
            station_id,
            sequence_number,
            distance_from_origin_km
        } = req.body;

        const stationId = parseId(station_id);
        const sequence = Number(sequence_number);

        if (!Number.isSafeInteger(sequence) || sequence <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid sequence number is required"
            });
        }

        const distance = distance_from_origin_km ?? null;

        if (
            distance !== null &&
            (!Number.isFinite(Number(distance)) || Number(distance) < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid station distance"
            });
        }

        const id = await LineService.assignStation(
            lineId,
            stationId,
            sequence,
            distance
        );

        res.status(201).json({
            success: true,
            message: "Station added to metro line",
            data: { id }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Station or sequence already exists on this line"
            });
        }

        next(error);
    }
};
