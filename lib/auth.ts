import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { query } from "./db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "sitebuilder_session";
const SESSION_DAYS = 30;

export type AppUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "admin";
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    "insert into app_sessions (user_id, token_hash, expires_at) values ($1, $2, $3)",
    [userId, tokenHash, expiresAt.toISOString()]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await query("delete from app_sessions where token_hash = $1", [hashToken(token)]);
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const users = await query<AppUser>(
    `select app_users.id, app_users.email, app_users.full_name, app_users.role
     from app_sessions
     join app_users on app_users.id = app_sessions.user_id
     where app_sessions.token_hash = $1
     and app_sessions.expires_at > now()
     limit 1`,
    [hashToken(token)]
  );

  return users[0] ?? null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
