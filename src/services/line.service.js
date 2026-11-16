
import * as Line from "../models/line.model.js";
import * as Station from "../models/station.model.js";

export const fetchLines = async () => {
    return await Line.getAllLines();
};

export const fetchLineById = async (id) => {
    const line = await Line.getLineById(id);

    if (!line) {
        const error = new Error("Metro line not found");
        error.status = 404;
        throw error;
    }

    return line;
};

export const addLine = async (data) => {
    return await Line.createLine(data);
};

export const fetchLineStations = async (lineId) => {
    await fetchLineById(lineId);

    return await Line.getLineStations(lineId);
};

export const assignStation = async (
    lineId,
    stationId,
    sequenceNumber,
    distance
) => {
    await fetchLineById(lineId);

    const station = await Station.getStationById(stationId);

    if (!station) {
        const error = new Error("Active station not found");
        error.status = 404;
        throw error;
    }

    if (sequenceNumber <= 0) {
        const error = new Error("Sequence number must be positive");
        error.status = 400;
        throw error;
    }

    return await Line.addStationToLine(
        lineId,
        stationId,
        sequenceNumber,
        distance
    );
};
