import { previewGithubSkills } from "@/lib/server/github-skill-importer";
import { writeAuditLog } from "@/lib/server/audit";
import { getRuntimeConfig } from "@/lib/server/config";
import { ApiError, getRequestIp, handleApiError, readJsonBody, requireUser } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PreviewRequest = {
  url?: string;
};

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof requireUser>> | null = null;

  try {
    const config = getRuntimeConfig();
    user = await requireUser();
    checkRateLimit(`skills:github:${user.account}:${getRequestIp(request)}`, 20, config.rateLimitWindowMs);

    const body = await readJsonBody<PreviewRequest>(request, config.maxJsonBytes);
    const url = String(body.url ?? "").trim();
    if (!url) {
      throw new ApiError(400, "GITHUB_SKILL_URL_REQUIRED", "请输入 GitHub Skill 地址");
    }

    const candidates = await previewGithubSkills(url);
    await writeAuditLog({
      event: "skills.github_previewed",
      request,
      actor: user,
      metadata: { url, count: candidates.length },
    });

    return Response.json({ candidates });
  } catch (error) {
    if (user) {
      await writeAuditLog({
        event: "skills.github_preview_failed",
        request,
        actor: user,
        metadata: { reason: error instanceof Error ? error.message : "unknown" },
      });
    }

    return handleApiError(error);
  }
}
