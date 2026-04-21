import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../env";

export type JwtPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(payload: JwtPayload) {
  const options: SignOptions = {
    // jsonwebtoken types expect ms.StringValue; our env is runtime-validated string
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_SECRET as Secret, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

