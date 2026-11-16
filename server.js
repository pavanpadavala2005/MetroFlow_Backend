
import "dotenv/config";

import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./src/app.js";

import { connectDatabase } from "./src/config/db.js";

import {
    initializeTrackingSockets
} from "./src/sockets/tracking.socket.js";

import {
    startTrainSimulation
} from "./src/services/train-simulator.service.js";


const PORT = process.env.PORT || 5000;


// START APPLICATION

const startServer = async () => {

    try {

        // Connect MySQL
        await connectDatabase();


        // Create HTTP server
        const server = createServer(app);


        // Initialize Socket.IO
        const io = new Server(server, {
            cors: {
                origin:
                    process.env.CLIENT_URL ||
                    "http://localhost:5173",

                methods: ["GET", "POST"],

                credentials: true
            }
        });


        // Initialize socket events
        initializeTrackingSockets(io);


        // Start train simulation
        startTrainSimulation(io);


        // Start HTTP server
        server.listen(PORT, () => {

            console.log("       METROFLOW SERVER");
            console.log(`Server running on port ${PORT}`);

            console.log(
                `API: http://localhost:${PORT}`
            );

            console.log(
                `Health: http://localhost:${PORT}/api/health`
            );

            console.log(
                `Socket.IO: Enabled`
            );

            console.log(
                `Train Simulation: Running`
            );

        });


        // Graceful shutdown
        const shutdown = () => {

            console.log("Shutting down MetroFlow...");

            server.close(() => {
                console.log("HTTP server closed");
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);


    } catch (error) {

        console.error(
            "Unable to start MetroFlow:",
            error.message
        );

        process.exit(1);
    }
};


startServer();
