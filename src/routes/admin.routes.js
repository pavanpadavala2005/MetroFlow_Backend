
import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();


// Admin dashboard
router.get(
    "/dashboard",
    authenticate,
    authorizeRoles("ADMIN"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome to MetroFlow Admin Dashboard",
            data: {
                userId: req.user.id,
                role: req.user.role
            }
        });
    }
);


export default router;
