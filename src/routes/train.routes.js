
import express from "express";

import * as TrainController from "../controllers/train.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.get("/", TrainController.getTrains);
router.get("/:id", TrainController.getTrain);

// Admin routes
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    TrainController.createTrain
);

router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    TrainController.updateTrain
);

// Admin and operator can update train status
router.patch(
    "/:id/status",
    authenticate,
    authorizeRoles("ADMIN", "OPERATOR"),
    TrainController.updateTrainStatus
);

export default router;
