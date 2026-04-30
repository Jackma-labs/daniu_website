import { getKnowledgeStats, getPublicKnowledgeItems } from "@/lib/knowledge/store";
import { handleApiError, requireUser } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    const [items, stats] = await Promise.all([getPublicKnowledgeItems(), getKnowledgeStats()]);
    return Response.json({ items, stats });
  } catch (error) {
    return handleApiError(error);
  }
}
