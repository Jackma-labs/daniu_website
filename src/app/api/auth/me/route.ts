import { getCurrentUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "未登录");
    }

    return Response.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
