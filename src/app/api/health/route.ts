import { getProviderStatuses } from "@/lib/ai/providers";
import { getKnowledgeStats } from "@/lib/knowledge/store";
import { getProductionReadiness, getRuntimeConfig } from "@/lib/server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getRuntimeConfig();
  const readiness = getProductionReadiness();
  const storage = await readStorageStatus();
  const status = readiness.ready && storage.status === "ok" ? "ok" : "degraded";
  const publicReadiness = {
    ready: readiness.ready,
    checkedAt: readiness.checkedAt,
    environment: readiness.environment,
    issues: readiness.issues,
  };

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      version: config.appVersion,
      environment: config.environment,
      storage,
      readiness: publicReadiness,
      providers: getProviderStatuses().map((provider) => ({
        provider: provider.provider,
        label: provider.label,
        configured: provider.configured,
        model: provider.model,
        priority: provider.priority,
      })),
    },
    { status: status === "ok" ? 200 : 503 }
  );
}

async function readStorageStatus() {
  try {
    const stats = await getKnowledgeStats();
    return { status: "ok" as const, stats };
  } catch (error) {
    return {
      status: "error" as const,
      error: error instanceof Error ? error.message : "知识库不可用",
    };
  }
}
