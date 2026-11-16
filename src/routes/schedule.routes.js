
import express from "express";

import * as ScheduleController from "../controllers/schedule.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Public
router.get(
    "/trains/:id/schedules",
    ScheduleController.getSchedules
);

// Admin
router.post(
    "/trains/:id/schedules",
    authenticate,
    authorizeRoles("ADMIN"),
    ScheduleController.createSchedule
);

export default router;
