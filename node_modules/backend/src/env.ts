import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

