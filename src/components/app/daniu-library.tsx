"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Search, Settings2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  daniuPersonaStorageKey,
  daniuPersonas,
  defaultDaniuPersonaIds,
  getEnabledDaniuPersonas,
  type DaniuPersona,
} from "@/lib/skills/daniu-personas";
import { cn } from "@/lib/utils";

type PreviewCandidate = DaniuPersona & {
  importId: string;
  source?: NonNullable<DaniuPersona["source"]> & {
    rawUrl?: string;
  };
};

export function DaniuLibrary() {
  const [personas, setPersonas] = useState<DaniuPersona[]>(daniuPersonas);
  const [enabledIds, setEnabledIds] = useState<string[]>(() => readEnabledPersonaIds());
  const [githubUrl, setGithubUrl] = useState("");
  const [previewCandidates, setPreviewCandidates] = useState<PreviewCandidate[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const enabledPersonas = useMemo(() => getEnabledDaniuPersonas(enabledIds, personas), [enabledIds, personas]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/skills", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { personas?: DaniuPersona[] } | null) => {
        if (!cancelled && Array.isArray(data?.personas) && data.personas.length) {
          const catalog = data.personas;
          setPersonas(catalog);
          setEnabledIds((current) => getEnabledDaniuPersonas(current, catalog).map((persona) => persona.id));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  function normalizeEnabledIds(nextIds: string[], catalog = personas) {
    return getEnabledDaniuPersonas(nextIds, catalog).map((persona) => persona.id);
  }

  function persist(nextIds: string[], catalog = personas) {
    const normalized = normalizeEnabledIds(nextIds, catalog);
    setEnabledIds(normalized);
    window.localStorage.setItem(daniuPersonaStorageKey, JSON.stringify(normalized));
  }

  function addPersona(id: string, catalog = personas) {
    if (enabledIds.includes(id)) {
      return;
    }

    const nextIds = enabledIds.length >= 3 ? [...enabledIds.slice(1), id] : [...enabledIds, id];
    persist(nextIds, catalog);
    window.dispatchEvent(new StorageEvent("storage", { key: daniuPersonaStorageKey }));
  }

  function removePersona(id: string) {
    if (enabledIds.length <= 1) {
      return;
    }

    persist(enabledIds.filter((item) => item !== id));
    window.dispatchEvent(new StorageEvent("storage", { key: daniuPersonaStorageKey }));
  }

  async function loadPersonas() {
    const response = await fetch("/api/skills", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("大牛库刷新失败");
    }

    const data = (await response.json()) as { personas?: DaniuPersona[] };
    const nextPersonas = Array.isArray(data.personas) && data.personas.length ? data.personas : daniuPersonas;
    setPersonas(nextPersonas);
    return nextPersonas;
  }

  async function previewGithub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const url = githubUrl.trim();
    if (!url) {
      setErrorMessage("请输入 GitHub 仓库、目录或 SKILL.md 地址。");
      return;
    }

    setIsPreviewing(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/skills/github/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as { candidates?: PreviewCandidate[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "GitHub Skill 预览失败");
      }

      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      setPreviewCandidates(candidates);
      setStatusMessage(candidates.length ? `找到 ${candidates.length} 个可导入的大牛视角。` : "没有找到可导入的 Skill。");
    } catch (error) {
      setPreviewCandidates([]);
      setErrorMessage(error instanceof Error ? error.message : "GitHub Skill 预览失败");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function importCandidate(candidate: PreviewCandidate) {
    setImportingId(candidate.importId);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/skills/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim(), importId: candidate.importId }),
      });
      const data = (await response.json()) as { persona?: DaniuPersona; error?: string };

      if (!response.ok || !data.persona) {
        throw new Error(data.error || "GitHub Skill 导入失败");
      }

      const nextPersonas = await loadPersonas();
      addPersona(data.persona.id, nextPersonas);
      setPreviewCandidates((current) => current.filter((item) => item.importId !== candidate.importId));
      setStatusMessage(`${data.persona.name} 已加入聊天页。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "GitHub Skill 导入失败");
    } finally {
      setImportingId(null);
    }
  }

  return (
    <div className="mt-9 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>聊天页已启用</CardTitle>
            <CardDescription>最多保留 3 个常用大牛视角。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {enabledPersonas.map((persona, index) => (
              <div key={persona.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>{persona.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{persona.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{persona.title}</div>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full">
                  槽位 {index + 1}
                </Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="text-xs leading-6 text-muted-foreground">
            新增一个视角时，会自动替换最早的槽位。聊天页会同步刷新。
          </CardFooter>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>从 GitHub 导入</CardTitle>
            <CardDescription>读取 SKILL.md 或 README.md，转成安全的大牛视角。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={previewGithub}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="github-skill-url">GitHub 地址</FieldLabel>
                  <Input
                    id="github-skill-url"
                    value={githubUrl}
                    onChange={(event) => setGithubUrl(event.target.value)}
                    placeholder="https://github.com/owner/repo"
                    aria-invalid={Boolean(errorMessage)}
                  />
                  <FieldDescription>支持仓库、目录、文件或 raw.githubusercontent.com 地址。</FieldDescription>
                </Field>
                <Button type="submit" disabled={isPreviewing || !githubUrl.trim()}>
                  {isPreviewing ? <Spinner data-icon="inline-start" /> : <Search data-icon="inline-start" />}
                  预览可导入项
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {errorMessage ? (
          <Alert variant="destructive">
            <ShieldCheck />
            <AlertTitle>导入失败</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {statusMessage ? (
          <Alert>
            <ShieldCheck />
            <AlertTitle>GitHub Skill</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        ) : null}

        {previewCandidates.length ? (
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>导入预览</CardTitle>
              <CardDescription>先确认来源和描述，再加入聊天页。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {previewCandidates.map((candidate) => (
                <Card key={candidate.importId} size="sm" className="rounded-2xl shadow-none">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar size="lg">
                        <AvatarFallback>{candidate.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate">{candidate.name}</CardTitle>
                        <CardDescription className="truncate">{candidate.source?.path || candidate.source?.repo || "GitHub Skill"}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{candidate.summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="rounded-full">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" onClick={() => importCandidate(candidate)} disabled={Boolean(importingId)}>
                      {importingId === candidate.importId ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                      导入并启用
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {personas.map((persona) => {
            const enabled = enabledIds.includes(persona.id);
            const isGithub = persona.source?.type === "github";

            return (
              <Card key={persona.id} className={cn("rounded-3xl shadow-none transition", enabled && "ring-2 ring-foreground/10")}>
                <CardHeader className="pb-2">
                  <CardAction>
                    <Badge variant={enabled ? "secondary" : "outline"} className="gap-1.5 rounded-full">
                      {enabled ? <Check /> : <ShieldCheck />}
                      {enabled ? "已启用" : isGithub ? "已导入" : "可选择"}
                    </Badge>
                  </CardAction>
                  <Avatar size="lg">
                    <AvatarFallback>{persona.avatar}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="pt-4">{persona.name}</CardTitle>
                  <CardDescription>{persona.title}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="min-h-12 text-sm leading-6 text-muted-foreground">{persona.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {persona.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-auto flex gap-2">
                    {enabled ? (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => removePersona(persona.id)} disabled={enabledIds.length <= 1}>
                        移出聊天页
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1" onClick={() => addPersona(persona.id)}>
                        加入聊天页
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" aria-label={`配置${persona.name}`}>
                      <Settings2 />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function readEnabledPersonaIds() {
  if (typeof window === "undefined") {
    return defaultDaniuPersonaIds;
  }

  try {
    const stored = window.localStorage.getItem(daniuPersonaStorageKey);
    const parsed = stored ? (JSON.parse(stored) as string[]) : defaultDaniuPersonaIds;
    return Array.isArray(parsed) && parsed.length ? parsed.slice(0, 3) : defaultDaniuPersonaIds;
  } catch {
    return defaultDaniuPersonaIds;
  }
}
