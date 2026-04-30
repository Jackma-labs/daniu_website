import "server-only";

import { getRuntimeConfig } from "@/lib/server/config";

export type ChatProvider = "auto" | "deepseek" | "minimax" | "local";
export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatCompletion = {
  provider: Exclude<ChatProvider, "auto">;
  model: string;
  content: string;
};

type ProviderConfig = {
  provider: Exclude<ChatProvider, "auto">;
  baseUrl: string;
  apiKey: string;
  model: string;
  endpoint: string;
  tokenParam?: "max_tokens" | "max_completion_tokens";
  extraBody?: Record<string, unknown>;
};

export type ProviderStatus = {
  provider: Exclude<ChatProvider, "auto">;
  label: string;
  configured: boolean;
  model: string;
  baseUrl: string;
  endpoint: string;
  priority: number;
};

const providerLabels: Record<Exclude<ChatProvider, "auto">, string> = {
  deepseek: "DeepSeek",
  minimax: "MiniMax",
  local: "本地大模型",
};

export function getConfiguredProviders() {
  return {
    deepseek: getDeepSeekConfig(),
    minimax: getMiniMaxConfig(),
    local: getLocalConfig(),
  };
}

export function getProviderStatuses(): ProviderStatus[] {
  const deepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const deepSeekModel = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";
  const minimaxBaseUrl = process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1";
  const minimaxModel = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";
  const localBaseUrl = process.env.DANIU_LOCAL_LLM_BASE_URL ?? "";
  const localModel = process.env.DANIU_LOCAL_LLM_MODEL ?? "";

  return [
    {
      provider: "deepseek",
      label: providerLabels.deepseek,
      configured: Boolean(process.env.DEEPSEEK_API_KEY),
      model: deepSeekModel,
      baseUrl: deepSeekBaseUrl,
      endpoint: "/chat/completions",
      priority: 1,
    },
    {
      provider: "minimax",
      label: providerLabels.minimax,
      configured: Boolean(process.env.MINIMAX_API_KEY),
      model: minimaxModel,
      baseUrl: minimaxBaseUrl,
      endpoint: "/chat/completions",
      priority: 2,
    },
    {
      provider: "local",
      label: providerLabels.local,
      configured: Boolean(localBaseUrl && process.env.DANIU_LOCAL_LLM_API_KEY && localModel),
      model: localModel || "未设置",
      baseUrl: localBaseUrl || "未设置",
      endpoint: "/chat/completions",
      priority: 3,
    },
  ];
}

export async function completeChat(provider: ChatProvider, messages: ChatMessage[]) {
  const configs = getConfiguredProviders();

  if (provider === "auto") {
    const attempts = [configs.deepseek, configs.minimax, configs.local].filter(Boolean) as ProviderConfig[];
    return completeWithFallback(attempts, messages);
  }

  const config = configs[provider];
  if (!config) {
    throw new Error(`${providerLabels[provider]} 未配置`);
  }

  return callChatProvider(config, messages);
}

async function completeWithFallback(configs: ProviderConfig[], messages: ChatMessage[]) {
  if (configs.length === 0) {
    throw new Error("没有可用模型配置");
  }

  let lastError: unknown;
  for (const config of configs) {
    try {
      return await callChatProvider(config, messages);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("模型调用失败");
}

async function callChatProvider(config: ProviderConfig, messages: ChatMessage[]): Promise<ChatCompletion> {
  const runtimeConfig = getRuntimeConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runtimeConfig.modelTimeoutMs);
  const tokenParam = config.tokenParam ?? "max_tokens";

  let response: Response;
  try {
    response = await fetch(joinUrl(config.baseUrl, config.endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
        temperature: 0.3,
        [tokenParam]: runtimeConfig.modelMaxTokens,
        ...config.extraBody,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${providerLabels[config.provider]} 响应超时`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = getProviderError(data) ?? `${providerLabels[config.provider]} 请求失败：${response.status}`;
    throw new Error(message);
  }

  const content = getAssistantContent(data);
  if (!content) {
    throw new Error(`${providerLabels[config.provider]} 没有返回有效内容`);
  }

  return {
    provider: config.provider,
    model: config.model,
    content,
  };
}

function getDeepSeekConfig(): ProviderConfig | null {
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-pro";

  if (!apiKey) {
    return null;
  }

  return {
    provider: "deepseek",
    baseUrl,
    apiKey,
    model,
    endpoint: "/chat/completions",
    tokenParam: "max_completion_tokens",
  };
}

function getMiniMaxConfig(): ProviderConfig | null {
  const baseUrl = process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1";
  const apiKey = process.env.MINIMAX_API_KEY;
  const model = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";

  if (!apiKey) {
    return null;
  }

  return {
    provider: "minimax",
    baseUrl,
    apiKey,
    model,
    endpoint: "/chat/completions",
  };
}

function getLocalConfig(): ProviderConfig | null {
  const baseUrl = process.env.DANIU_LOCAL_LLM_BASE_URL;
  const apiKey = process.env.DANIU_LOCAL_LLM_API_KEY;
  const model = process.env.DANIU_LOCAL_LLM_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return null;
  }

  return {
    provider: "local",
    baseUrl,
    apiKey,
    model,
    endpoint: "/chat/completions",
  };
}

function getAssistantContent(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const maybe = data as {
    choices?: Array<{ message?: { content?: unknown }; delta?: { content?: unknown } }>;
    reply?: unknown;
    output_text?: unknown;
  };

  const content = maybe.choices?.[0]?.message?.content ?? maybe.choices?.[0]?.delta?.content ?? maybe.reply ?? maybe.output_text;
  return typeof content === "string" ? content : null;
}

function getProviderError(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const maybe = data as { error?: { message?: unknown }; message?: unknown; base_resp?: { status_msg?: unknown } };
  const message = maybe.error?.message ?? maybe.message ?? maybe.base_resp?.status_msg;
  return typeof message === "string" ? message : null;
}

function joinUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
}
