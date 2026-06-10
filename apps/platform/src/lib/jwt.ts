import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import { NextRequest } from "next/server";

export type AuthPayload = { id: number; email: string };

export const signToken = (id: number, email: string) =>
  jwt.sign({ id, email }, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
};

/**
 * Extract + verify the JWT from an incoming request's Authorization header.
 * Returns the user payload, or null if no/invalid token.
 */
export const requireAuth = (req: NextRequest): AuthPayload | null => {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7));
};

/** Short-lived signed state token for OAuth redirects. */
export type OauthState = {
  userId: number;
  name: string;
  provider: string;
  extra?: Record<string, string>;
};

export const signOauthState = (payload: OauthState) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "10m" });

export const verifyOauthState = (token: string): OauthState | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as OauthState;
  } catch {
    return null;
  }
};
