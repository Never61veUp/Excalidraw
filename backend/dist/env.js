"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(8080),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    CORS_ORIGIN: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
