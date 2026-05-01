import { getAllDaniuPersonas } from "@/lib/server/skill-store";
import { handleApiError, requireUser } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    return Response.json({ personas: await getAllDaniuPersonas() });
  } catch (error) {
    return handleApiError(error);
  }
}
