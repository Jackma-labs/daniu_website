import { getKnowledgeStats, getPublicKnowledgeItems } from "@/lib/knowledge/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [items, stats] = await Promise.all([getPublicKnowledgeItems(), getKnowledgeStats()]);
  return Response.json({ items, stats });
}
