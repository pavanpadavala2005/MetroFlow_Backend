
import * as Schedule from "../models/schedule.model.js";
import * as Train from "../models/train.model.js";
import * as Line from "../models/line.model.js";

export const fetchSchedules = async (trainId) => {
    const train = await Train.getTrainById(trainId);

    if (!train) {
        const error = new Error("Train not found");
        error.status = 404;
        throw error;
    }

    return await Schedule.getSchedulesByTrainId(trainId);
};

export const addSchedule = async (trainId, data) => {
    const train = await Train.getTrainById(trainId);

    if (!train) {
        const error = new Error("Train not found");
        error.status = 404;
        throw error;
    }

    const stations = await Line.getLineStations(train.line_id);

    const sourceIndex = stations.findIndex(
        station => station.id === data.origin_station_id
    );

    const destinationIndex = stations.findIndex(
        station => station.id === data.destination_station_id
    );

    if (
        sourceIndex === -1 ||
        destinationIndex === -1 ||
        sourceIndex === destinationIndex
    ) {
        const error = new Error(
            "Schedule stations must belong to the train line and follow the line's forward direction"
        );

        error.status = 400;
        throw error;
    }

    return await Schedule.createSchedule(trainId, data);
};
