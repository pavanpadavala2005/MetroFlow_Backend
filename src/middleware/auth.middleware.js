
import jwt from "jsonwebtoken";

// Authenticate user using JWT
export const authenticate = (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;

        // Check Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token required"
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                issuer: "metroflow-api",
                audience: "metroflow-client"
            }
        );

        // Attach authenticated user to request
        req.user = {
            id: Number(decoded.sub),
            role: decoded.role
        };

        next();

    } catch (error) {

        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token"
            });
        }

        next(error);
    }
};
