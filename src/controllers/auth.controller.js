
import {
    registerUser,
    loginUser
} from "../services/auth.service.js";

import { findUserById } from "../models/user.model.js";


// REGISTER

export const register = async (req, res, next) => {
    try {
        const {
            full_name,
            email,
            phone,
            password
        } = req.body;

        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid registration data"
            });
        }

        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must contain 2 to 100 characters"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and no more than 72 bytes"
            });
        }

        if (
            phone !== undefined &&
            phone !== null &&
            (typeof phone !== "string" || phone.trim().length > 15)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        const user = await registerUser({
            full_name: name,
            email: normalizedEmail,
            phone: phone?.trim() || null,
            password
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: { user }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email or phone number already registered"
            });
        }

        next(error);
    }
};


// LOGIN

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await loginUser(
            email.trim().toLowerCase(),
            password
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// GET CURRENT USER

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await findUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.account_status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Your account is not active"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            data: { user }
        });

    } catch (error) {
        next(error);
    }
};
