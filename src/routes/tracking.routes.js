
import express from "express";

import {
    getAllPositions,
    getPositionByTrainId,
    getUpcomingTrains
} from "../controllers/tracking.controller.js";

const router = express.Router();


// All train positions
router.get("/positions", getAllPositions);


// Position of a particular train
router.get(
    "/trains/:trainId",
    getPositionByTrainId
);


// Upcoming trains for a journey
router.get(
    "/upcoming",
    getUpcomingTrains
);

export default router;
