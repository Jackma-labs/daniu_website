import { findKnowledgeSources } from "@/lib/knowledge/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 3);

  if (!query.trim()) {
    return Response.json({ sources: [] });
  }

  const sources = await findKnowledgeSources(query, Number.isFinite(limit) ? limit : 3);
  return Response.json({ sources });
}
