"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./env");
const auth_1 = require("./routes/auth");
const boards_1 = require("./routes/boards");
const authRequired_1 = require("./middleware/authRequired");
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN ? env_1.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
}));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", auth_1.authRouter);
app.use("/boards", authRequired_1.authRequired, boards_1.boardsRouter);
app.listen(env_1.env.PORT, "0.0.0.0", () => {
    console.log(`backend listening on :${env_1.env.PORT}`);
});
