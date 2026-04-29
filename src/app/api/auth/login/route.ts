import { cookies } from "next/headers";
import { createSessionToken, DANIU_SESSION_COOKIE, getSessionCookieOptions, validateCredentials } from "@/lib/auth";

export const runtime = "nodejs";

type LoginRequest = {
  account?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginRequest;
  const account = String(body.account ?? "").trim();
  const password = String(body.password ?? "");

  if (!account || !password) {
    return Response.json({ error: "请输入账号和密码" }, { status: 400 });
  }

  const user = validateCredentials(account, password);
  if (!user) {
    return Response.json({ error: "账号或密码不正确" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(DANIU_SESSION_COOKIE, createSessionToken(user), getSessionCookieOptions());

  return Response.json({ user });
}
