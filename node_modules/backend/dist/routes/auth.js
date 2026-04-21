"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const jwt_1 = require("../auth/jwt");
exports.authRouter = (0, express_1.Router)();
const credentialsSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.authRouter.post("/register", async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body" });
    const { email, password } = parsed.data;
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    try {
        const result = await db_1.pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email", [email.toLowerCase(), passwordHash]);
        const user = result.rows[0];
        const token = (0, jwt_1.signAccessToken)({ sub: user.id, email: user.email });
        return res.json({ token, user });
    }
    catch (e) {
        if (String(e?.code) === "23505") {
            return res.status(409).json({ error: "email_taken" });
        }
        return res.status(500).json({ error: "server_error" });
    }
});
exports.authRouter.post("/login", async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "invalid_body" });
    const { email, password } = parsed.data;
    const result = await db_1.pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email.toLowerCase()]);
    const row = result.rows[0];
    if (!row)
        return res.status(401).json({ error: "invalid_credentials" });
    const ok = await bcryptjs_1.default.compare(password, row.password_hash);
    if (!ok)
        return res.status(401).json({ error: "invalid_credentials" });
    const token = (0, jwt_1.signAccessToken)({ sub: row.id, email: row.email });
    return res.json({ token, user: { id: row.id, email: row.email } });
});
