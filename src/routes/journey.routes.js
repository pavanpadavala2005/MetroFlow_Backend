
import express from "express";

import {
    scanEntry,
    scanExit,
    getMyJourneys
} from "../controllers/journey.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Passenger: view their own journey history.
router.get(
    "/my",
    authenticate,
    getMyJourneys
);

// Gate operations: only ADMIN and OPERATOR accounts.
router.post(
    "/entry",
    authenticate,
    authorizeRoles("ADMIN", "OPERATOR"),
    scanEntry
);

router.post(
    "/exit",
    authenticate,
    authorizeRoles("ADMIN", "OPERATOR"),
    scanExit
);

export default router;
