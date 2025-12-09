import jwt from "jsonwebtoken";
import { User } from "../../database/postgres_sequelize.js";

export async function authorizeRequest(req, res, next) {
    let header = req.headers.authorization || req.headers.Authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return next({ status: 401, message: "unauthorized request" });
    }

    const token = header.split(" ")[1];
    if (!token) {
        return next({ status: 401, message: "unauthorized request" });
    }

    jwt.verify(token, process.env.JWT_PASS, async (err, decoded) => {
        if (err) {
            return next({ status: 401, message: "unauthorized request" });
        }

        const user = await User.findOne({
            where: {
                id: decoded.id,
                is_active: true,
                blocked: false,
            },
            attributes: {
                exclude: ["password", "is_active", "blocked"],
            },
        });

        if (!user) {
            return next({ status: 401, message: "unauthorized request" });
        }

        req.user = user;
        return next();
    });
}

export function authorizeAdmin(req, res, next) {
    if (req.user.role === "admin") {
        return next();
    }

    return res.status(403).json({
        status: 403,
        message: "forbidden",
    });
}

export function authorizeEditor(req, res, next) {
    if (req.user.role === "editor") {
        return next();
    }

    return res.status(403).json({
        status: 403,
        message: "forbidden - editor role required",
    });
}

export function authorizeAdminOrEditor(req, res, next) {
    if (req.user.role === "admin" || req.user.role === "editor") {
        return next();
    }

    return res.status(403).json({
        status: 403,
        message: "forbidden - admin or editor role required",
    });
}
