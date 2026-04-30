import { saveKnowledgeFile } from "@/lib/knowledge/store";
import { writeAuditLog } from "@/lib/server/audit";
import { getRuntimeConfig, isUploadExtensionAllowed } from "@/lib/server/config";
import { ApiError, assertContentLength, getRequestIp, handleApiError, requireUser } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof requireUser>> | null = null;

  try {
    const config = getRuntimeConfig();
    user = await requireUser();
    checkRateLimit(`knowledge:upload:${user.account}:${getRequestIp(request)}`, config.uploadRateLimit, config.rateLimitWindowMs);
    assertContentLength(request, config.maxUploadBytes * config.maxUploadFiles + 1024 * 1024);

    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

    if (!files.length) {
      throw new ApiError(400, "UPLOAD_FILES_REQUIRED", "请选择要喂给大牛的资料");
    }

    if (files.length > config.maxUploadFiles) {
      throw new ApiError(413, "UPLOAD_TOO_MANY_FILES", `一次最多上传 ${config.maxUploadFiles} 个文件`);
    }

    for (const file of files) {
      if (file.size > config.maxUploadBytes) {
        throw new ApiError(413, "UPLOAD_FILE_TOO_LARGE", `${file.name || "文件"} 超过单文件大小限制`);
      }

      if (!isUploadExtensionAllowed(file.name || "")) {
        throw new ApiError(415, "UPLOAD_FILE_TYPE_UNSUPPORTED", `${file.name || "文件"} 的格式暂不支持`);
      }
    }

    const items = await Promise.all(files.map((file) => saveKnowledgeFile(file)));
    await writeAuditLog({
      event: "knowledge.uploaded",
      request,
      actor: user,
      metadata: { fileCount: items.length, chunkCount: items.reduce((sum, item) => sum + item.chunks, 0) },
    });

    return Response.json({ items });
  } catch (error) {
    if (user) {
      await writeAuditLog({
        event: "knowledge.upload_failed",
        request,
        actor: user,
        metadata: { reason: error instanceof Error ? error.message : "unknown" },
      });
    }

    return handleApiError(error);
  }
}
