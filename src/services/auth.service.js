import bcrypt from "bcrypt";

import {
    findUserByEmail,
    createUser
} from "../models/user.model.js";

import { generateToken } from "../utils/token.util.js";


// REGISTER USER

export const registerUser = async (userData) => {

    const {
        full_name,
        email,
        phone,
        password
    } = userData;

    // Check existing user
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        const error = new Error("Email already registered");
        error.status = 409;
        throw error;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const userId = await createUser({
        full_name,
        email,
        phone,
        password_hash
    });

    return {
        id: userId,
        full_name,
        email,
        phone: phone || null,
        role: "PASSENGER"
    };
};


// LOGIN USER

export const loginUser = async (email, password) => {

    // Find user
    const user = await findUserByEmail(email);

    // Avoid revealing whether email exists
    if (!user) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    // Check account status
    if (user.account_status !== "ACTIVE") {
        const error = new Error("Your account is not active");
        error.status = 403;
        throw error;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    // Generate JWT
    const token = generateToken(user);

    // Return safe user information
    return {
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
        token
    };
};
