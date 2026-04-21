import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../db";
import { signAccessToken } from "../auth/jwt";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const { email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), passwordHash],
    );

    const user = result.rows[0] as { id: string; email: string };
    const token = signAccessToken({ sub: user.id, email: user.email });
    return res.json({ token, user });
  } catch (e: any) {
    if (String(e?.code) === "23505") {
      return res.status(409).json({ error: "email_taken" });
    }
    return res.status(500).json({ error: "server_error" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const { email, password } = parsed.data;
  const result = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email.toLowerCase()],
  );

  const row = result.rows[0] as { id: string; email: string; password_hash: string } | undefined;
  if (!row) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const token = signAccessToken({ sub: row.id, email: row.email });
  return res.json({ token, user: { id: row.id, email: row.email } });
});

