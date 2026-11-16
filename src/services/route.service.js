
import * as Route from "../models/route.model.js";
import * as Station from "../models/station.model.js";

export const findJourneyRoute = async (
    sourceStationId,
    destinationStationId
) => {

    // Validate source station
    const source = await Station.getStationById(sourceStationId);

    if (!source) {
        const error = new Error("Source station not found");
        error.status = 404;
        throw error;
    }

    // Validate destination station
    const destination = await Station.getStationById(destinationStationId);

    if (!destination) {
        const error = new Error("Destination station not found");
        error.status = 404;
        throw error;
    }

    if (sourceStationId === destinationStationId) {
        const error = new Error(
            "Source and destination stations cannot be the same"
        );

        error.status = 400;
        throw error;
    }

    // Find common metro lines
    const commonLines = await Route.findCommonLines(
        sourceStationId,
        destinationStationId
    );

    if (commonLines.length === 0) {
        const error = new Error(
            "No direct route found between these stations"
        );

        error.status = 404;
        throw error;
    }

    // Select the first matching direct line
    const selectedLine = commonLines[0];

    // Fetch intermediate stations in correct direction
    const stations = await Route.getStationsBetween(
        selectedLine.line_id,
        selectedLine.source_sequence,
        selectedLine.destination_sequence
    );

    const totalDistance = Math.abs(
        Number(stations[stations.length - 1].distance_from_origin_km) -
        Number(stations[0].distance_from_origin_km)
    );

    return {
        line: {
            id: selectedLine.line_id,
            name: selectedLine.line_name,
            code: selectedLine.line_code
        },

        source: {
            id: source.id,
            name: source.station_name
        },

        destination: {
            id: destination.id,
            name: destination.station_name
        },

        totalStations: stations.length,
        intermediateStations: Math.max(0, stations.length - 2),
        totalDistanceKm: Number(totalDistance.toFixed(2)),

        direction:
            selectedLine.source_sequence <
            selectedLine.destination_sequence
                ? "FORWARD"
                : "REVERSE",

        stations
    };
};
