import { findKnowledgeSources } from "@/lib/knowledge/store";
import { handleApiError, requireUser } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser();

    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().slice(0, 2000);
    const requestedLimit = Number(url.searchParams.get("limit") ?? 3);
    const limit = Number.isFinite(requestedLimit) ? Math.min(20, Math.max(1, Math.floor(requestedLimit))) : 3;

    if (!query) {
      return Response.json({ sources: [] });
    }

    const sources = await findKnowledgeSources(query, limit);
    return Response.json({ sources });
  } catch (error) {
    return handleApiError(error);
  }
}
