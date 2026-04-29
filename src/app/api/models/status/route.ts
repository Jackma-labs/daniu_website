import { getProviderStatuses } from "@/lib/ai/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ providers: getProviderStatuses() });
}
