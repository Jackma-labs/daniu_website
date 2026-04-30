import "server-only";

import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { getRuntimeConfig } from "@/lib/server/config";
import { getRequestIp } from "@/lib/server/http";
import type { AuthUser } from "@/lib/auth";

type AuditInput = {
  event: string;
  request?: Request;
  actor?: Pick<AuthUser, "account" | "role"> | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    const config = getRuntimeConfig();
    const auditDir = path.join(/*turbopackIgnore: true*/ config.storageDir, "audit");
    const date = new Date().toISOString().slice(0, 10);
    const filePath = path.join(/*turbopackIgnore: true*/ auditDir, `${date}.jsonl`);
    const entry = {
      timestamp: new Date().toISOString(),
      event: input.event,
      actor: input.actor ?? null,
      ip: input.request ? getRequestIp(input.request) : undefined,
      userAgent: input.request?.headers.get("user-agent") ?? undefined,
      metadata: sanitizeMetadata(input.metadata ?? {}),
    };

    await mkdir(/* turbopackIgnore: true */ auditDir, { recursive: true });
    await appendFile(/* turbopackIgnore: true */ filePath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // 审计日志不能影响主流程。
  }
}

function sanitizeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (/key|secret|token|password/i.test(key)) {
        return [key, "[redacted]"];
      }

      if (typeof value === "string") {
        return [key, value.slice(0, 500)];
      }

      return [key, value];
    })
  );
}
