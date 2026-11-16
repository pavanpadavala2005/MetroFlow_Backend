
import {
    getAllTrainPositions,
    getStationsForTracking,
    updateTrainPosition
} from "../models/tracking.model.js";

let simulationTimer = null;
let isProcessing = false;

const TRAVEL_TIME_SECONDS = Math.max(
    5,
    Number(process.env.TRAIN_SIMULATION_TRAVEL_SECONDS || 30)
);

const UPDATE_INTERVAL_MS = Math.max(
    2000,
    Number(process.env.TRAIN_SIMULATION_INTERVAL_MS || 5000)
);

// PROCESS ONE TRAIN
const processTrain = async (train, io) => {

    const stations = await getStationsForTracking(train.line_id);

    if (stations.length < 2) {
        return;
    }

    const currentIndex = stations.findIndex(
        station => Number(station.station_id) ===
            Number(train.current_station_id)
    );

    const nextIndex = stations.findIndex(
        station => Number(station.station_id) ===
            Number(train.next_station_id)
    );

    if (
        currentIndex === -1 ||
        nextIndex === -1 ||
        currentIndex === nextIndex
    ) {
        return;
    }

    const now = new Date();

    const estimatedArrival = train.estimated_arrival_at
        ? new Date(train.estimated_arrival_at)
        : null;

    // Initialize missing arrival time
    if (!estimatedArrival || Number.isNaN(estimatedArrival.getTime())) {

        const nextArrival = new Date(
            now.getTime() + TRAVEL_TIME_SECONDS * 1000
        );

        await updateTrainPosition(
            train.train_id,
            train.current_station_id,
            train.next_station_id,
            nextArrival,
            "MOVING"
        );

        return;
    }

    // Train has not reached the next station
    if (now < estimatedArrival) {
        return;
    }

    // Determine movement direction
    let direction = Math.sign(nextIndex - currentIndex);

    // Train has reached its next station
    const newCurrentIndex = nextIndex;

    // Find the following station
    let newNextIndex = newCurrentIndex + direction;

    // Reverse direction at terminal station
    if (
        newNextIndex < 0 ||
        newNextIndex >= stations.length
    ) {
        direction *= -1;
        newNextIndex = newCurrentIndex + direction;
    }

    const newCurrentStation =
        stations[newCurrentIndex];

    const newNextStation =
        stations[newNextIndex];

    const newEstimatedArrival = new Date(
        now.getTime() + TRAVEL_TIME_SECONDS * 1000
    );

    // Update MySQL
    await updateTrainPosition(
        train.train_id,
        newCurrentStation.station_id,
        newNextStation.station_id,
        newEstimatedArrival,
        "MOVING"
    );

    // Broadcast updated position
    const eventData = {
        trainId: train.train_id,
        trainCode: train.train_code,
        lineId: train.line_id,

        currentStation: {
            id: newCurrentStation.station_id,
            name: newCurrentStation.station_name
        },

        nextStation: {
            id: newNextStation.station_id,
            name: newNextStation.station_name
        },

        estimatedArrivalAt: newEstimatedArrival.toISOString(),
        status: "MOVING",
        updatedAt: now.toISOString()
    };

    // Notify all passengers subscribed to this line
    io.to(`line:${train.line_id}`).emit(
        "train:position_updated",
        eventData
    );

    // Notify passengers subscribed to stations on this line
    for (const station of stations) {
        io.to(`station:${station.station_id}`).emit(
            "train:position_updated",
            eventData
        );
    }

    console.log(
        `[TRAIN UPDATE] ${train.train_code}: ` +
        `${newCurrentStation.station_name} -> ` +
        `${newNextStation.station_name}`
    );
};

// RUN SIMULATION
export const runSimulationTick = async (io) => {

    if (isProcessing) {
        return;
    }

    isProcessing = true;

    try {

        const trains = await getAllTrainPositions();

        for (const train of trains) {

            if (train.train_status === "OUT_OF_SERVICE") {
                continue;
            }

            try {
                await processTrain(train, io);

            } catch (error) {
                console.error(
                    `Simulation error for ${train.train_code}:`,
                    error.message
                );
            }
        }

    } catch (error) {
        console.error(
            "Train simulation failed:",
            error.message
        );

    } finally {
        isProcessing = false;
    }
};

// START SIMULATION
export const startTrainSimulation = (io) => {

    if (simulationTimer) {
        console.log("Train simulation is already running");
        return;
    }

    console.log("Train simulation started");

    // Run immediately
    runSimulationTick(io);

    // Repeat simulation
    simulationTimer = setInterval(() => {
        runSimulationTick(io);
    }, UPDATE_INTERVAL_MS);
};

// STOP SIMULATION
export const stopTrainSimulation = () => {

    if (simulationTimer) {
        clearInterval(simulationTimer);
        simulationTimer = null;

        console.log("Train simulation stopped");
    }
};
