import { getProviderStatuses } from "@/lib/ai/providers";
import { getProductionReadiness } from "@/lib/server/config";
import { handleApiError, requireUser } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    return Response.json({ providers: getProviderStatuses(), readiness: getProductionReadiness() });
  } catch (error) {
    return handleApiError(error);
  }
}
