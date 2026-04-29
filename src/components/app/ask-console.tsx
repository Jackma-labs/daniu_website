"use client";

import { useMemo, useState } from "react";
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
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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

export function AskConsole() {
  const [provider, setProvider] = useState<Provider>("auto");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);
  const hasConversation = messages.length > 0;

  async function askDaniu(question = input) {
    const content = question.trim();
    if (!content || isLoading) {
      return;
    }

    const userMessage: UiMessage = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
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
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.content,
          provider: result.provider,
          model: result.model,
          sources: result.sources,
        },
      ]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: requestError instanceof Error ? requestError.message : "模型服务暂时不可用",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setInput("");
  }

  return (
    <section
      className={cn(
        "flex w-full max-w-4xl flex-1 flex-col items-center",
        hasConversation ? "justify-start text-left" : "justify-center text-center"
      )}
    >
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
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
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
                onClick={() => askDaniu(item.text)}
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
    </section>
  );
}
