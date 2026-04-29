import { completeChat, type ChatMessage, type ChatProvider } from "@/lib/ai/providers";

export const runtime = "nodejs";

type ChatRequest = {
  provider?: ChatProvider;
  messages?: ChatMessage[];
};

const systemPrompt: ChatMessage = {
  role: "system",
  content: "你是大牛，企业自己的本地 AI 专家。回答要直接、克制、可执行。遇到不确定内容，要说明需要补充哪些资料。",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const provider = body.provider ?? "auto";
    const messages = normalizeMessages(body.messages);

    if (!messages.length) {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    const result = await completeChat(provider, [systemPrompt, ...messages]);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "模型服务暂时不可用";
    return Response.json({ error: message }, { status: 500 });
  }
}

function normalizeMessages(messages: ChatMessage[] | undefined) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => ["system", "user", "assistant"].includes(message.role))
    .map((message) => ({ role: message.role, content: String(message.content ?? "").trim() }))
    .filter((message) => message.content.length > 0)
    .slice(-12);
}
