
import express from "express";

import * as LineController from "../controllers/line.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.get("/", LineController.getLines);
router.get("/:id", LineController.getLine);
router.get("/:id/stations", LineController.getLineStations);

// Admin routes
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    LineController.createLine
);

router.post(
    "/:id/stations",
    authenticate,
    authorizeRoles("ADMIN"),
    LineController.addStationToLine
);

export default router;
