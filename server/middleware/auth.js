import { UserGoogle } from "../db/db.js";

async function isLoggedIn(req, res, next) {
    if (!(req.session && req.session.passport && req.session.passport.user?.id)) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        const profileId = String(req.session.passport.user.id);
        const user = await UserGoogle.findOne({ profileId }).lean();

        if (!user) {
            return res.status(401).json({ message: "User not found." });
        }

        req.user = {
            ...user,
            role: user.role || "user"
        };

        next();
    } catch (error) {
        console.error("Error loading authenticated user:", error);
        res.status(500).json({ message: "Failed to validate session." });
    }
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const role = req.user.role || "user";

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ message: "Forbidden." });
        }

        next();
    };
}

export { isLoggedIn, authorizeRoles };
