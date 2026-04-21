import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../auth/jwt";

export type AuthedRequest = Request & {
  user?: { id: string; email: string };
};

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

