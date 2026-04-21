"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequired = authRequired;
const jwt_1 = require("../auth/jwt");
function authRequired(req, res, next) {
    const header = req.header("authorization") || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "missing_token" });
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = { id: payload.sub, email: payload.email };
        return next();
    }
    catch {
        return res.status(401).json({ error: "invalid_token" });
    }
}
