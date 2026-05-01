import { importGithubSkill } from "@/lib/server/github-skill-importer";
import { writeAuditLog } from "@/lib/server/audit";
import { getRuntimeConfig } from "@/lib/server/config";
import { ApiError, getRequestIp, handleApiError, readJsonBody, requireUser } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportRequest = {
  url?: string;
  importId?: string;
};

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof requireUser>> | null = null;

  try {
    const config = getRuntimeConfig();
    user = await requireUser();
    checkRateLimit(`skills:github-import:${user.account}:${getRequestIp(request)}`, 20, config.rateLimitWindowMs);

    const body = await readJsonBody<ImportRequest>(request, config.maxJsonBytes);
    const url = String(body.url ?? "").trim();
    const importId = body.importId ? String(body.importId).trim() : undefined;
    if (!url) {
      throw new ApiError(400, "GITHUB_SKILL_URL_REQUIRED", "请输入 GitHub Skill 地址");
    }

    const persona = await importGithubSkill(url, importId);
    await writeAuditLog({
      event: "skills.github_imported",
      request,
      actor: user,
      metadata: { id: persona.id, name: persona.name, url, importId },
    });

    return Response.json({ persona });
  } catch (error) {
    if (user) {
      await writeAuditLog({
        event: "skills.github_import_failed",
        request,
        actor: user,
        metadata: { reason: error instanceof Error ? error.message : "unknown" },
      });
    }

    return handleApiError(error);
  }
}
