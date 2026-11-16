
import * as StationService from "../services/station.service.js";

const parseId = (value) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error("Invalid station ID");
        error.status = 400;
        throw error;
    }

    return id;
};

const sendError = (error, next) => {
    if (error.code === "ER_DUP_ENTRY") {
        return {
            handled: true,
            status: 409,
            message: "Station code already exists"
        };
    }

    next(error);
};


// GET ALL STATIONS
export const getStations = async (req, res, next) => {
    try {
        const stations = await StationService.fetchStations();

        res.status(200).json({
            success: true,
            count: stations.length,
            data: { stations }
        });

    } catch (error) {
        next(error);
    }
};


// GET STATION BY ID
export const getStation = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        const station = await StationService.fetchStationById(id);

        res.status(200).json({
            success: true,
            data: { station }
        });

    } catch (error) {
        next(error);
    }
};


// CREATE STATION
export const createStation = async (req, res, next) => {
    try {
        const {
            station_code,
            station_name,
            address,
            latitude,
            longitude
        } = req.body;

        if (
            typeof station_code !== "string" ||
            typeof station_name !== "string" ||
            !station_code.trim() ||
            !station_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Station code and station name are required"
            });
        }

        if (
            station_code.trim().length > 20 ||
            station_name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Station code or name is too long"
            });
        }

        if (address !== undefined && address !== null &&
            (typeof address !== "string" || address.length > 255)) {
            return res.status(400).json({
                success: false,
                message: "Invalid station address"
            });
        }

        for (const coordinate of [latitude, longitude]) {
            if (
                coordinate !== undefined &&
                coordinate !== null &&
                (!Number.isFinite(Number(coordinate)) ||
                 Number(coordinate) < -180 ||
                 Number(coordinate) > 180)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid station coordinates"
                });
            }
        }

        const id = await StationService.addStation({
            station_code: station_code.trim().toUpperCase(),
            station_name: station_name.trim(),
            address: address?.trim() || null,
            latitude: latitude ?? null,
            longitude: longitude ?? null
        });

        res.status(201).json({
            success: true,
            message: "Station created successfully",
            data: { id }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Station code already exists"
            });
        }

        next(error);
    }
};


// UPDATE STATION
export const updateStation = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        const {
            station_name,
            address,
            latitude,
            longitude
        } = req.body;

        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        if (
            station_name !== undefined &&
            (typeof station_name !== "string" ||
             !station_name.trim() ||
             station_name.trim().length > 100)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid station name"
            });
        }

        if (
            address !== undefined &&
            address !== null &&
            (typeof address !== "string" || address.length > 255)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid station address"
            });
        }

        for (const coordinate of [latitude, longitude]) {
            if (
                coordinate !== undefined &&
                coordinate !== null &&
                (!Number.isFinite(Number(coordinate)) ||
                 Number(coordinate) < -180 ||
                 Number(coordinate) > 180)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid station coordinates"
                });
            }
        }

        const station = await StationService.modifyStation(id, {
            station_name: station_name?.trim(),
            address,
            latitude,
            longitude
        });

        res.status(200).json({
            success: true,
            message: "Station updated successfully",
            data: { station }
        });

    } catch (error) {
        next(error);
    }
};


// DELETE / DEACTIVATE STATION
export const deleteStation = async (req, res, next) => {
    try {
        const id = parseId(req.params.id);

        await StationService.removeStation(id);

        res.status(200).json({
            success: true,
            message: "Station deactivated successfully"
        });

    } catch (error) {
        next(error);
    }
};
