import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pp_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export type SessionPayload = { userId: string; role: string; name: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || !payload.userId.trim() ||
        typeof payload.role !== "string" || !payload.role.trim() ||
        typeof payload.name !== "string" || typeof payload.exp !== "number") return null;
    return { userId: payload.userId, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
