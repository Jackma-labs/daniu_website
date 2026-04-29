import { getKnowledgeItems, getKnowledgeStats } from "@/lib/knowledge/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [items, stats] = await Promise.all([getKnowledgeItems(), getKnowledgeStats()]);
  return Response.json({ items, stats });
}
