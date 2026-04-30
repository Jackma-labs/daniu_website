import { cookies } from "next/headers";
import { createSessionToken, DANIU_SESSION_COOKIE, getSessionCookieOptions, validateCredentials } from "@/lib/auth";
import { getProductionReadiness, getRuntimeConfig } from "@/lib/server/config";
import { writeAuditLog } from "@/lib/server/audit";
import { ApiError, getRequestIp, handleApiError, readJsonBody } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequest = {
  account?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const config = getRuntimeConfig();
    const ip = getRequestIp(request);
    checkRateLimit(`auth:login:${ip}`, config.loginRateLimit, config.rateLimitWindowMs);

    const readiness = getProductionReadiness();
    const authBlocker = readiness.issues.find((issue) => issue.level === "error" && issue.code.startsWith("AUTH_"));
    if (authBlocker) {
      throw new ApiError(503, authBlocker.code, authBlocker.message);
    }

    const body = await readJsonBody<LoginRequest>(request, config.maxJsonBytes);
    const account = String(body.account ?? "").trim();
    const password = String(body.password ?? "");

    if (!account || !password) {
      throw new ApiError(400, "AUTH_CREDENTIALS_REQUIRED", "请输入账号和密码");
    }

    const user = validateCredentials(account, password);
    if (!user) {
      await writeAuditLog({ event: "auth.login_failed", request, metadata: { account } });
      throw new ApiError(401, "AUTH_INVALID_CREDENTIALS", "账号或密码不正确");
    }

    const cookieStore = await cookies();
    cookieStore.set(DANIU_SESSION_COOKIE, createSessionToken(user), getSessionCookieOptions());
    await writeAuditLog({ event: "auth.login_success", request, actor: user });

    return Response.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
