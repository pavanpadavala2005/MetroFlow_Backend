import jwt from "jsonwebtoken";

// Generate JWT token
export const generateToken = (user) => {

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
        {
            role: user.role 
        },
        process.env.JWT_SECRET,
        {
            subject: String(user.id),
            expiresIn: "1h",
            issuer: "metroflow-api",
            audience: "metroflow-client"
        }
    );

    return token;
};
