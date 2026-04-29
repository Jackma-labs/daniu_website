"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  BookOpenCheck,
  Bot,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FileUp,
  GraduationCap,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Provider = "auto" | "local" | "minimax";

type ChatResult = {
  provider: "local" | "minimax";
  model: string;
  content: string;
};

const examples = [
  { icon: Wrench, text: "最近售后最常见的问题是什么？" },
  { icon: BookOpenCheck, text: "这个客户适合推荐哪个型号？" },
  { icon: ClipboardList, text: "帮我写一份设备故障处理方案" },
  { icon: CircleDollarSign, text: "报价时有哪些注意事项？" },
];

const capabilities = [
  { icon: FileText, text: "产品知识" },
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

export function AskConsole() {
  const [provider, setProvider] = useState<Provider>("auto");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<ChatResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  async function askDaniu(question = input) {
    const content = question.trim();
    if (!content) {
      return;
    }

    setInput(content);
    setAnswer(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          messages: [{ role: "user", content }],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "模型服务暂时不可用");
      }

      setAnswer(data as ChatResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "模型服务暂时不可用");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
      <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
        <Sparkles className="size-3" strokeWidth={1.8} />
        本地模型 + 企业知识库
      </Badge>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">问大牛</h1>
      <p className="mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
        把老师傅、专家和项目经验沉淀进企业自己的 AI。问产品、问报价、问故障、问制度，先让大牛给答案。
      </p>

      {(answer || error || isLoading) && (
        <Card className="mt-8 w-full rounded-2xl border-foreground/10 text-left shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" strokeWidth={1.8} />}
                大牛回答
              </div>
              {answer && (
                <Badge variant="outline" className="rounded-full">
                  {providerNames[answer.provider]} · {answer.model}
                </Badge>
              )}
            </div>
            {isLoading && <p className="text-sm text-muted-foreground">正在整理企业知识和模型回答...</p>}
            {error && <p className="text-sm leading-7 text-destructive">{error}</p>}
            {answer && <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{answer.content}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="mt-8 w-full gap-0 rounded-2xl border-foreground/10 bg-card p-0 shadow-xl shadow-foreground/5">
        <CardContent className="p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              askDaniu();
            }}
          >
            <Textarea
              rows={4}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-32 resize-none border-0 bg-transparent px-3 py-3 text-base leading-7 shadow-none focus-visible:ring-0 md:text-base"
              placeholder="直接问大牛，或者上传资料让它学习。"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t px-1 pb-1 pt-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                  <FileUp className="size-4" strokeWidth={1.8} />
                  上传资料让它学
                </Button>
                <div className="hidden items-center gap-1 rounded-lg border bg-muted/30 p-1 sm:flex">
                  {providers.map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={provider === item.value ? "secondary" : "ghost"}
                      size="xs"
                      onClick={() => setProvider(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {answer && (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="重新开始" onClick={() => { setInput(""); setAnswer(null); setError(null); }}>
                    <RotateCcw className="size-4" strokeWidth={1.8} />
                  </Button>
                )}
                <Button type="submit" size="icon" aria-label="发送" disabled={!canSubmit}>
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" strokeWidth={1.8} />}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
        {examples.map((item) => (
          <Button
            key={item.text}
            variant="outline"
            className="h-auto justify-start gap-2 rounded-xl px-4 py-3 text-left text-sm font-normal text-muted-foreground"
            onClick={() => askDaniu(item.text)}
            disabled={isLoading}
          >
            <item.icon className="size-4 text-muted-foreground/70" strokeWidth={1.8} />
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
    </section>
  );
}
