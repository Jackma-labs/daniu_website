import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const DANIU_SESSION_COOKIE = "daniu_session";
export const DANIU_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthUser = {
  account: string;
  name: string;
  role: string;
};

type SessionPayload = AuthUser & {
  issuedAt: number;
  expiresAt: number;
};

const defaultAccount = "admin@daniu.local";
const defaultPassword = "daniu123456";
const defaultSecret = "daniu-dev-session-secret";

export function validateCredentials(account: string, password: string): AuthUser | null {
  const configuredAccount = process.env.DANIU_ADMIN_ACCOUNT || defaultAccount;
  const configuredPassword = process.env.DANIU_ADMIN_PASSWORD || defaultPassword;

  if (!safeEqual(account.trim(), configuredAccount) || !safeEqual(password, configuredPassword)) {
    return null;
  }

  return {
    account: configuredAccount,
    name: "管理员",
    role: "企业管理员",
  };
}

export function createSessionToken(user: AuthUser) {
  const now = Date.now();
  const payload: SessionPayload = {
    ...user,
    issuedAt: now,
    expiresAt: now + DANIU_SESSION_MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): AuthUser | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(signature, sign(body))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (!payload.account || !payload.name || !payload.role || !payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return {
      account: payload.account,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(DANIU_SESSION_COOKIE)?.value);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DANIU_SESSION_MAX_AGE,
  };
}

function sign(value: string) {
  return createHmac("sha256", process.env.DANIU_SESSION_SECRET || defaultSecret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}
