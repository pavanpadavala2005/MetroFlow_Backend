
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import stationRoutes from "./routes/station.routes.js";
import lineRoutes from "./routes/line.routes.js";
import trainRoutes from "./routes/train.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import routeRoutes from "./routes/route.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import journeyRoutes from "./routes/journey.routes.js";

const app = express();


// GLOBAL MIDDLEWAR
app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));


// ROO
app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Welcome to MetroFlow API"
    });
});


// HEALTH CHEC
app.get("/api/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "MetroFlow server is running",
        timestamp: new Date().toISOString()
    });
});


// AUTHENTICATIO
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);


// METRO MANAGEMEN
app.use("/api/stations", stationRoutes);
app.use("/api/lines", lineRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api", scheduleRoutes);
app.use("/api/routes", routeRoutes);


// TRAIN TRACKIN
app.use("/api/tracking", trackingRoutes);

// TICKET ROUTES
app.use("/api/tickets", ticketRoutes);

// JOURNEY ROUTES
app.use("/api/journeys", journeyRoutes);


// 404 HANDLE
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});


// GLOBAL ERROR HANDLE
app.use((err, req, res, next) => {

    console.error(err);

    const statusCode = err.status || 500;

    res.status(statusCode).json({
        success: false,

        message:
            statusCode >= 500 &&
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message
    });
});

export default app;
