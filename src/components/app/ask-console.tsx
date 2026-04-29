"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  BookOpenCheck,
  Bot,
  CircleDollarSign,
  ClipboardList,
  CornerDownLeft,
  FileSearch,
  FileUp,
  GraduationCap,
  MessageCircleQuestion,
  MessageSquareText,
  Plus,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/ai/providers";

type Provider = "auto" | "local" | "minimax";

type ChatResult = {
  provider: "local" | "minimax";
  model: string;
  content: string;
  sources?: KnowledgeSource[];
};

type UiMessage = ChatMessage & {
  id: string;
  provider?: ChatResult["provider"];
  model?: string;
  sources?: KnowledgeSource[];
  error?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UiMessage[];
};

type KnowledgeSource = {
  id: string;
  itemId: string;
  name: string;
  domain: string;
  summary: string;
  chunks: number;
  snippet: string;
  chunkIndex: number;
};

const examples = [
  { icon: Wrench, text: "最近售后最常见的问题是什么？" },
  { icon: BookOpenCheck, text: "这个客户适合推荐哪个型号？" },
  { icon: ClipboardList, text: "帮我写一份设备故障处理方案" },
  { icon: CircleDollarSign, text: "报价时有哪些注意事项？" },
];

const capabilities = [
  { icon: FileSearch, text: "产品知识" },
  { icon: CircleDollarSign, text: "报价经验" },
  { icon: Wrench, text: "故障处理" },
  { icon: ClipboardList, text: "项目复盘" },
  { icon: ShieldCheck, text: "制度流程" },
  { icon: GraduationCap, text: "新人培训" },
];

const providers: Array<{ value: Provider; label: string }> = [
  { value: "auto", label: "自动" },
  { value: "local", label: "本地" },
  { value: "minimax", label: "MiniMax" },
];

const providerNames = {
  local: "本地大模型",
  minimax: "MiniMax",
};

const answerRules = [
  "先查企业知识库",
  "答不准就标记待学习",
  "关键结论给出处",
];

const sessionStorageKey = "daniu.chat.sessions.v1";
const maxSessions = 24;

function createSessionTitle(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 24 ? `${compact.slice(0, 24)}...` : compact || "新的对话";
}

function updateSessionMessages(sessions: ChatSession[], sessionId: string, message: UiMessage) {
  const now = new Date().toISOString();

  return sessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          updatedAt: now,
          messages: [...session.messages, message],
        }
      : session
  );
}

function formatSessionTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function AskConsole() {
  const [provider, setProvider] = useState<Provider>("auto");
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hasHydratedSessions, setHasHydratedSessions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId), [activeSessionId, sessions]);
  const messages = activeSession?.messages ?? [];
  const canSubmit = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const hasConversation = messages.length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(sessionStorageKey);
        const parsed = stored ? (JSON.parse(stored) as ChatSession[]) : [];
        const validSessions = Array.isArray(parsed)
          ? parsed
              .filter((session) => session.id && session.title && Array.isArray(session.messages))
              .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
              .slice(0, maxSessions)
          : [];

        setSessions(validSessions);
        setActiveSessionId(validSessions[0]?.id ?? null);
      } catch {
        setSessions([]);
        setActiveSessionId(null);
      } finally {
        setHasHydratedSessions(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasHydratedSessions) {
      return;
    }

    window.localStorage.setItem(sessionStorageKey, JSON.stringify(sessions.slice(0, maxSessions)));
  }, [hasHydratedSessions, sessions]);

  async function askDaniu(question = input) {
    const content = question.trim();
    if (!content || isLoading) {
      return;
    }

    const userMessage: UiMessage = { id: crypto.randomUUID(), role: "user", content };
    const sessionId = activeSession?.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const nextMessages = [...messages, userMessage];

    setActiveSessionId(sessionId);
    setSessions((current) => {
      const existing = current.find((session) => session.id === sessionId);
      const nextSession: ChatSession = {
        id: sessionId,
        title: existing?.title ?? createSessionTitle(content),
        updatedAt: now,
        messages: nextMessages,
      };

      return [nextSession, ...current.filter((session) => session.id !== sessionId)].slice(0, maxSessions);
    });
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "模型服务暂时不可用");
      }

      const result = data as ChatResult;
      const assistantMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.content,
        provider: result.provider,
        model: result.model,
        sources: result.sources,
      };

      setSessions((current) => updateSessionMessages(current, sessionId, assistantMessage));
    } catch (requestError) {
      const assistantMessage: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: requestError instanceof Error ? requestError.message : "模型服务暂时不可用",
        error: true,
      };

      setSessions((current) => updateSessionMessages(current, sessionId, assistantMessage));
    } finally {
      setIsLoading(false);
    }
  }

  function resetConversation() {
    setActiveSessionId(null);
    setInput("");
  }

  function selectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setInput("");
  }

  function clearSessions() {
    if (isLoading) {
      return;
    }

    setSessions([]);
    setActiveSessionId(null);
    setInput("");
  }

  return (
    <section className="w-full max-w-6xl flex-1">
      <div className="grid w-full gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:flex">
          <Card className="sticky top-20 h-[calc(100dvh-6rem)] w-full rounded-2xl shadow-none">
            <CardContent className="flex h-full flex-col gap-3 p-3">
              <div className="flex items-center gap-2">
                <Button className="flex-1 justify-start" onClick={resetConversation}>
                  <Plus data-icon="inline-start" />
                  新对话
                </Button>
                {sessions.length ? (
                  <Button variant="outline" size="icon" aria-label="清空对话记录" onClick={clearSessions} disabled={isLoading}>
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
              <div className="px-1 text-xs font-medium text-muted-foreground">最近对话</div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-1 pr-2">
                  {sessions.length ? (
                    sessions.map((session) => (
                      <Button
                        key={session.id}
                        variant={session.id === activeSessionId ? "secondary" : "ghost"}
                        className="h-auto justify-start rounded-xl px-3 py-2 text-left"
                        onClick={() => selectSession(session.id)}
                        disabled={isLoading && session.id !== activeSessionId}
                      >
                        <MessageSquareText data-icon="inline-start" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{session.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{formatSessionTime(session.updatedAt)}</span>
                        </span>
                      </Button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed p-3 text-xs leading-6 text-muted-foreground">
                      问一次大牛，这里就会留下对话记录。切到喂资料或牛大脑，再回来也不会丢。
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        <div
          className={cn(
            "flex min-w-0 flex-col items-center",
            hasConversation ? "justify-start text-left" : "justify-center text-center"
          )}
        >
          {sessions.length ? (
            <div className="mb-5 flex w-full flex-col gap-2 lg:hidden">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground">最近对话</span>
                <Button variant="ghost" size="xs" onClick={clearSessions} disabled={isLoading}>
                  <Trash2 data-icon="inline-start" />
                  清空
                </Button>
              </div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {sessions.slice(0, 8).map((session) => (
                  <Button
                    key={session.id}
                    variant={session.id === activeSessionId ? "secondary" : "outline"}
                    className="h-auto max-w-56 shrink-0 justify-start rounded-xl px-3 py-2 text-left"
                    onClick={() => selectSession(session.id)}
                    disabled={isLoading && session.id !== activeSessionId}
                  >
                    <MessageSquareText data-icon="inline-start" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs">{session.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{formatSessionTime(session.updatedAt)}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
      <div className={cn("flex flex-col items-center", hasConversation && "w-full items-start")}>
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
          <Sparkles className="size-3" strokeWidth={1.8} />
          本地模型 + 企业知识库
        </Badge>
        <h1 className={cn("mt-5 font-semibold tracking-tight", hasConversation ? "text-3xl" : "text-4xl md:text-5xl")}>问大牛</h1>
        <p className={cn("mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground", hasConversation && "max-w-xl")}>
          把老师傅、专家和项目经验沉淀进企业自己的 AI。问产品、问报价、问故障、问制度，先让大牛给答案。
        </p>
        {!hasConversation && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {answerRules.map((rule) => (
              <Badge key={rule} variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
                <MessageCircleQuestion className="size-3" strokeWidth={1.8} />
                {rule}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {hasConversation && (
        <Card className="mt-6 w-full rounded-3xl border-foreground/10 text-left shadow-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[48dvh] rounded-3xl">
              <div className="flex flex-col gap-4 p-4 md:p-5">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                    {message.role !== "user" && (
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                        <Bot className="size-4" strokeWidth={1.8} />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "min-w-0 flex-1 border bg-card text-card-foreground shadow-sm"
                      )}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">大牛</span>
                            {message.provider && message.model && (
                              <Badge variant="outline" className="rounded-full text-[11px]">
                                {providerNames[message.provider]} · {message.model}
                              </Badge>
                            )}
                            {message.sources?.length ? (
                              <Badge variant="secondary" className="rounded-full text-[11px]">
                                引用 {message.sources.length} 份资料
                              </Badge>
                            ) : null}
                          </div>
                          <p className={cn("mt-2 whitespace-pre-wrap", message.error ? "text-destructive" : "text-muted-foreground")}>
                            {message.content}
                          </p>
                          {message.sources?.length ? (
                            <div className="mt-4 flex flex-col gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Quote className="size-3.5" strokeWidth={1.8} />
                                来源依据
                              </div>
                              {message.sources.map((source) => (
                                <div key={source.id} className="rounded-xl border bg-muted/30 p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="rounded-full text-[11px]">
                                      {source.domain}
                                    </Badge>
                                    <span className="text-xs font-medium">{source.name}</span>
                                    {source.chunkIndex ? <span className="text-xs text-muted-foreground">片段 {source.chunkIndex}</span> : null}
                                  </div>
                                  <p className="mt-2 max-h-20 overflow-hidden text-xs leading-6 text-muted-foreground">{source.snippet}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background">
                      <Spinner />
                    </span>
                    <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
                      <div className="font-medium">大牛正在查资料</div>
                      <div className="mt-1 text-muted-foreground">先检索本地知识库，再组织模型回答。</div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card className={cn("w-full gap-0 rounded-2xl border-foreground/10 bg-card p-0 shadow-xl shadow-foreground/5", hasConversation ? "mt-4" : "mt-8")}>
        <CardContent className="p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void askDaniu();
            }}
          >
            <InputGroup className={cn(hasConversation ? "min-h-28" : "min-h-36")}>
              <InputGroupTextarea
                rows={hasConversation ? 3 : 4}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDownCapture={(event) => {
                  const isEnter = event.key === "Enter" || event.code === "Enter";
                  if (isEnter && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.stopPropagation();
                    void askDaniu();
                  }
                }}
                className={cn("px-3 py-3 text-base leading-7 md:text-base", hasConversation ? "min-h-20" : "min-h-28")}
                placeholder={hasConversation ? "继续追问大牛，Shift + Enter 换行..." : "直接问大牛，或者上传资料让它学习。"}
              />
              <InputGroupAddon align="block-end" className="border-t">
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <InputGroupButton variant="secondary" size="sm" nativeButton={false} render={<Link href="/app/learn" />}>
                      <FileUp data-icon="inline-start" />
                      上传资料让它学
                    </InputGroupButton>
                    <ToggleGroup
                      value={[provider]}
                      onValueChange={(value) => {
                        const nextProvider = value[0] as Provider | undefined;
                        if (nextProvider) {
                          setProvider(nextProvider);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex"
                    >
                      {providers.map((item) => (
                        <ToggleGroupItem key={item.value} value={item.value} aria-label={`切换到${item.label}模型`}>
                          {item.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex">
                      <CornerDownLeft className="size-3.5" strokeWidth={1.8} />
                      Enter 发送
                    </span>
                    {hasConversation && (
                      <InputGroupButton type="button" variant="ghost" size="icon-sm" aria-label="重新开始" onClick={resetConversation}>
                        <RotateCcw />
                      </InputGroupButton>
                    )}
                    <InputGroupButton type="submit" variant="default" size="icon-sm" aria-label="发送" disabled={!canSubmit}>
                      {isLoading ? <Spinner /> : <ArrowUp />}
                    </InputGroupButton>
                  </div>
                </div>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </CardContent>
      </Card>

      {!hasConversation && (
        <>
          <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
            {examples.map((item) => (
              <Button
                key={item.text}
                variant="outline"
                className="h-auto justify-start rounded-xl px-4 py-3 text-left text-sm font-normal text-muted-foreground"
                onClick={() => void askDaniu(item.text)}
                disabled={isLoading}
              >
                <item.icon data-icon="inline-start" />
                <span>{item.text}</span>
              </Button>
            ))}
          </div>

          <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
            {capabilities.map((item) => (
              <Badge key={item.text} variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
                <item.icon className="size-3" strokeWidth={1.8} />
                {item.text}
              </Badge>
            ))}
          </div>
        </>
      )}
        </div>
      </div>
    </section>
  );
}
