import { completeChat, type ChatMessage, type ChatProvider } from "@/lib/ai/providers";
import { findKnowledgeSources, type KnowledgeSource } from "@/lib/knowledge/store";
import { writeAuditLog } from "@/lib/server/audit";
import { getRuntimeConfig } from "@/lib/server/config";
import { ApiError, getRequestIp, handleApiError, readJsonBody, requireUser } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  provider?: ChatProvider;
  messages?: ChatMessage[];
};

const systemPrompt: ChatMessage = {
  role: "system",
  content:
    "你是大牛，企业自己的本地 AI 专家。回答要直接、克制、可执行。优先基于企业知识来源回答；遇到不确定内容，要说明需要补充哪些资料。",
};

const allowedProviders: ChatProvider[] = ["auto", "local", "minimax"];

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof requireUser>> | null = null;

  try {
    const config = getRuntimeConfig();
    user = await requireUser();
    checkRateLimit(`chat:${user.account}:${getRequestIp(request)}`, config.chatRateLimit, config.rateLimitWindowMs);

    const body = await readJsonBody<ChatRequest>(request, config.maxJsonBytes);
    const provider = normalizeProvider(body.provider);
    const messages = normalizeMessages(body.messages, config.chatMessageLimit, config.chatMessageMaxChars);

    if (!messages.length) {
      throw new ApiError(400, "CHAT_MESSAGE_REQUIRED", "请输入问题");
    }

    const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    if (!lastQuestion) {
      throw new ApiError(400, "CHAT_USER_MESSAGE_REQUIRED", "请输入要问大牛的问题");
    }

    const sources = await findKnowledgeSources(lastQuestion, config.ragSourceLimit);
    const sourcePrompt = buildSourcePrompt(sources);
    const result = await completeChat(provider, sourcePrompt ? [systemPrompt, sourcePrompt, ...messages] : [systemPrompt, ...messages]).catch(
      (error) => {
        throw new ApiError(502, "MODEL_ERROR", error instanceof Error ? error.message : "模型服务暂时不可用");
      }
    );

    await writeAuditLog({
      event: "chat.completed",
      request,
      actor: user,
      metadata: { provider: result.provider, model: result.model, messageCount: messages.length, sourceCount: sources.length },
    });

    return Response.json({ ...result, sources });
  } catch (error) {
    if (user) {
      await writeAuditLog({
        event: "chat.failed",
        request,
        actor: user,
        metadata: { reason: error instanceof Error ? error.message : "unknown" },
      });
    }

    return handleApiError(error);
  }
}

function normalizeProvider(provider: unknown): ChatProvider {
  return allowedProviders.includes(provider as ChatProvider) ? (provider as ChatProvider) : "auto";
}

function normalizeMessages(messages: ChatMessage[] | undefined, limit: number, maxChars: number) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => ["user", "assistant"].includes(message.role))
    .map((message) => ({ role: message.role, content: String(message.content ?? "").trim().slice(0, maxChars) }))
    .filter((message) => message.content.length > 0)
    .slice(-limit);
}

function buildSourcePrompt(sources: KnowledgeSource[]): ChatMessage | null {
  if (!sources.length) {
    return null;
  }

  return {
    role: "system",
    content: `以下是本地知识库检索到的候选片段。回答时优先参考这些片段，并在答案末尾用“参考资料：”列出文件名。\n${sources
      .map((source, index) => `${index + 1}. ${source.name}｜${source.domain}｜片段 ${source.chunkIndex || "-"}｜${source.snippet}`)
      .join("\n")}`,
  };
}
