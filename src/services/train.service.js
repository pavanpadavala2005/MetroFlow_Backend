
import * as Train from "../models/train.model.js";
import * as Line from "../models/line.model.js";

export const fetchTrains = async () => {
    return await Train.getAllTrains();
};

export const fetchTrainById = async (id) => {
    const train = await Train.getTrainById(id);

    if (!train) {
        const error = new Error("Train not found");
        error.status = 404;
        throw error;
    }

    return train;
};

export const addTrain = async (data) => {
    const line = await Line.getLineById(data.line_id);

    if (!line) {
        const error = new Error("Active metro line not found");
        error.status = 404;
        throw error;
    }

    return await Train.createTrain(data);
};

export const modifyTrain = async (id, data) => {
    await fetchTrainById(id);

    await Train.updateTrain(id, data);

    return await Train.getTrainById(id);
};

export const changeTrainStatus = async (id, status) => {
    await fetchTrainById(id);

    await Train.updateTrainStatus(id, status);

    return await Train.getTrainById(id);
};
