
import * as Station from "../models/station.model.js";

export const fetchStations = async () => {
    return await Station.getAllStations();
};

export const fetchStationById = async (id) => {
    const station = await Station.getStationById(id);

    if (!station) {
        const error = new Error("Station not found");
        error.status = 404;
        throw error;
    }

    return station;
};

export const addStation = async (data) => {
    return await Station.createStation(data);
};

export const modifyStation = async (id, data) => {
    const existing = await Station.getStationById(id);

    if (!existing) {
        const error = new Error("Station not found");
        error.status = 404;
        throw error;
    }

    const updated = {
        station_name: data.station_name ?? existing.station_name,
        address: data.address ?? existing.address,
        latitude: data.latitude ?? existing.latitude,
        longitude: data.longitude ?? existing.longitude
    };

    await Station.updateStation(id, updated);

    return await Station.getStationById(id);
};

export const removeStation = async (id) => {
    const deleted = await Station.deactivateStation(id);

    if (!deleted) {
        const error = new Error("Station not found");
        error.status = 404;
        throw error;
    }

    return true;
};
