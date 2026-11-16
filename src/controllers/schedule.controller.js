
import * as ScheduleService from "../services/schedule.service.js";

const parseId = (value) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error("Invalid ID");
        error.status = 400;
        throw error;
    }

    return id;
};

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const VALID_DAYS = [
    "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"
];


// GET TRAIN SCHEDULES
export const getSchedules = async (req, res, next) => {
    try {
        const trainId = parseId(req.params.id);

        const schedules = await ScheduleService.fetchSchedules(trainId);

        res.status(200).json({
            success: true,
            count: schedules.length,
            data: { schedules }
        });

    } catch (error) {
        next(error);
    }
};


// CREATE TRAIN SCHEDULE
export const createSchedule = async (req, res, next) => {
    try {
        const trainId = parseId(req.params.id);

        const {
            origin_station_id,
            destination_station_id,
            departure_time,
            arrival_time,
            service_days
        } = req.body;

        const sourceId = Number(origin_station_id);
        const destinationId = Number(destination_station_id);

        if (
            !Number.isSafeInteger(sourceId) ||
            sourceId <= 0 ||
            !Number.isSafeInteger(destinationId) ||
            destinationId <= 0 ||
            sourceId === destinationId
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid and different origin and destination stations are required"
            });
        }

        if (
            typeof departure_time !== "string" ||
            typeof arrival_time !== "string" ||
            !TIME_REGEX.test(departure_time) ||
            !TIME_REGEX.test(arrival_time)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid departure and arrival times are required"
            });
        }

        const days = service_days ??
            VALID_DAYS;

        if (
            !Array.isArray(days) ||
            days.length === 0 ||
            days.some(day => !VALID_DAYS.includes(day)) ||
            new Set(days).size !== days.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid service days"
            });
        }

        const id = await ScheduleService.addSchedule(
            trainId,
            {
                origin_station_id: sourceId,
                destination_station_id: destinationId,
                departure_time,
                arrival_time,
                service_days: days.join(",")
            }
        );

        res.status(201).json({
            success: true,
            message: "Train schedule created successfully",
            data: { id }
        });

    } catch (error) {
        next(error);
    }
};
