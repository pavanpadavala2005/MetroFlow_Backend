
export const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        // Authentication must run first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please authenticate first"
            });
        }

        // Check user role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource"
            });
        }

        next();
    };
};
