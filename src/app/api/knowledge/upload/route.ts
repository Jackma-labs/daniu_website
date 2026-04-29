import { saveKnowledgeFile } from "@/lib/knowledge/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) {
    return Response.json({ error: "请选择要学习的资料" }, { status: 400 });
  }

  const items = await Promise.all(files.map((file) => saveKnowledgeFile(file)));
  return Response.json({ items });
}
