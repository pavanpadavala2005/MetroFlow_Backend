
import express from "express";

import { getJourneyRoute } from "../controllers/route.controller.js";

const router = express.Router();

router.get("/journey", getJourneyRoute);

export default router;
    