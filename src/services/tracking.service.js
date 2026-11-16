
import {
    getAllTrainPositions,
    getTrainPositionById,
    getTrainsByLine,
    getStationsForTracking,
    getCommonLinesForJourney
} from "../models/tracking.model.js";


// ==========================================
// GET ALL TRAIN POSITIONS
// ==========================================

export const fetchAllTrainPositions = async () => {

    return await getAllTrainPositions();
};


// ==========================================
// GET ONE TRAIN POSITION
// ==========================================

export const fetchTrainPosition = async (trainId) => {

    const position = await getTrainPositionById(trainId);

    if (!position) {
        const error = new Error("Train position not found");
        error.status = 404;
        throw error;
    }

    return position;
};


// ==========================================
// GET UPCOMING TRAINS
// ==========================================

export const fetchUpcomingTrains = async (
    sourceStationId,
    destinationStationId
) => {

    if (sourceStationId === destinationStationId) {
        const error = new Error(
            "Source and destination cannot be the same"
        );

        error.status = 400;
        throw error;
    }

    // Find lines connecting both stations
    const commonLines = await getCommonLinesForJourney(
        sourceStationId,
        destinationStationId
    );

    if (commonLines.length === 0) {
        const error = new Error(
            "No direct metro route found"
        );

        error.status = 404;
        throw error;
    }

    const upcomingTrains = [];

    const now = Date.now();

    const travelTimeSeconds = Math.max(
        5,
        Number(process.env.TRAIN_SIMULATION_TRAVEL_SECONDS || 30)
    );

    const travelTimeMs = travelTimeSeconds * 1000;

    for (const line of commonLines) {

        const stations = await getStationsForTracking(line.line_id);

        const sourceIndex = stations.findIndex(
            station => Number(station.sequence_number) ===
                Number(line.source_sequence)
        );

        const destinationIndex = stations.findIndex(
            station => Number(station.sequence_number) ===
                Number(line.destination_sequence)
        );

        if (
            sourceIndex === -1 ||
            destinationIndex === -1 ||
            sourceIndex === destinationIndex
        ) {
            continue;
        }

        const direction = Math.sign(
            destinationIndex - sourceIndex
        );

        const trains = await getTrainsByLine(line.line_id);

        for (const train of trains) {

            if (
                train.train_status === "OUT_OF_SERVICE" ||
                train.next_station_id === null
            ) {
                continue;
            }

            const currentIndex = stations.findIndex(
                station => Number(station.station_id) ===
                    Number(train.current_station_id)
            );

            const nextIndex = stations.findIndex(
                station => Number(station.station_id) ===
                    Number(train.next_station_id)
            );

            if (currentIndex === -1 || nextIndex === -1) {
                continue;
            }

            const trainDirection = Math.sign(
                nextIndex - currentIndex
            );

            // Train must travel in the required direction
            if (trainDirection !== direction) {
                continue;
            }

            // Destination must still be ahead of the train
            const destinationAhead =
                direction > 0
                    ? currentIndex < destinationIndex
                    : currentIndex > destinationIndex;

            if (!destinationAhead) {
                continue;
            }

            // Source must be ahead of or at current position
            const sourceAhead =
                direction > 0
                    ? currentIndex <= sourceIndex
                    : currentIndex >= sourceIndex;

            if (!sourceAhead) {
                continue;
            }

            const estimatedNextArrival = train.estimated_arrival_at
                ? new Date(train.estimated_arrival_at).getTime()
                : now + travelTimeMs;

            if (Number.isNaN(estimatedNextArrival)) {
                continue;
            }

            let estimatedArrivalAtSource;

            if (currentIndex === sourceIndex) {

                // Train is already at the source station
                estimatedArrivalAtSource = now;

            } else {

                // Number of remaining stations after the next station
                const additionalStops = Math.abs(
                    sourceIndex - nextIndex
                );

                estimatedArrivalAtSource =
                    estimatedNextArrival +
                    additionalStops * travelTimeMs;
            }

            const arrivalInSeconds = Math.max(
                0,
                Math.ceil(
                    (estimatedArrivalAtSource - now) / 1000
                )
            );

            const remainingStops = Math.abs(
                destinationIndex - sourceIndex
            );

            upcomingTrains.push({
                trainId: train.train_id,
                trainCode: train.train_code,

                line: {
                    id: line.line_id,
                    name: line.line_name,
                    code: line.line_code
                },

                currentStationId: train.current_station_id,
                nextStationId: train.next_station_id,

                arrivalInSeconds,

                arrivalInMinutes: Math.ceil(
                    arrivalInSeconds / 60
                ),

                estimatedArrivalAt: new Date(
                    estimatedArrivalAtSource
                ).toISOString(),

                remainingStops,

                status: train.position_status
            });
        }
    }

    // Sort by estimated arrival time
    upcomingTrains.sort(
        (a, b) => a.arrivalInSeconds - b.arrivalInSeconds
    );

    return {
        sourceStationId,
        destinationStationId,
        totalUpcomingTrains: upcomingTrains.length,
        trains: upcomingTrains
    };
};
