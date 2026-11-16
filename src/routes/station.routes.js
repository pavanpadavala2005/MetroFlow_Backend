
import express from "express";

import * as StationController from "../controllers/station.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.get("/", StationController.getStations);
router.get("/:id", StationController.getStation);

// Admin routes
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    StationController.createStation
);

router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    StationController.updateStation
);

router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    StationController.deleteStation
);

export default router;
