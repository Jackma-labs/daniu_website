"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileArchive, FileSpreadsheet, FileText, FileUp, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { PublicKnowledgeItem } from "@/lib/knowledge/store";

type KnowledgeStats = {
  total: number;
  learned: number;
  pending: number;
  chunks: number;
  domains: number;
};

const statusText = {
  learned: "已学会",
  processing: "正在整理",
  needs_review: "待确认",
};

export function LearnConsole({ initialItems, initialStats }: { initialItems: PublicKnowledgeItem[]; initialStats: KnowledgeStats }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItems);
  const [stats, setStats] = useState(initialStats);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.size > 0);
    if (!files.length || isUploading) {
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setError("");
    setIsUploading(true);

    try {
      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { items?: PublicKnowledgeItem[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "上传失败");
      }

      const nextItems = [...(data.items ?? []), ...items];
      setItems(nextItems);
      setStats({
        total: nextItems.length,
        learned: nextItems.filter((item) => item.status === "learned").length,
        pending: nextItems.filter((item) => item.status !== "learned").length,
        chunks: nextItems.reduce((sum, item) => sum + item.chunks, 0),
        domains: new Set(nextItems.map((item) => item.domain)).size,
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <Card className="mt-9 overflow-hidden rounded-3xl border-dashed border-foreground/15 bg-card p-0 shadow-sm">
        <CardContent className="grid gap-0 p-0 md:grid-cols-[1fr_280px]">
          <div
            className={cn(
              "flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center transition-colors",
              isDragging && "bg-muted/50"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              uploadFiles(event.dataTransfer.files);
            }}
          >
            <span className="flex size-14 items-center justify-center rounded-2xl border bg-muted/60 shadow-sm">
              {isUploading ? <Spinner className="size-6" /> : <UploadCloud className="size-6 text-foreground/70" strokeWidth={1.7} />}
            </span>
            <div>
              <h2 className="text-xl font-medium tracking-tight">{isUploading ? "大牛正在吃资料" : "拖拽文件到这里"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">支持 PDF / Word / PPT / Excel / 图片 / 音频 / 视频</p>
            </div>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
            <Button className="mt-1" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Spinner data-icon="inline-start" /> : <FileUp data-icon="inline-start" />}
              选择文件
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="relative hidden overflow-hidden border-l bg-[radial-gradient(circle_at_30%_20%,rgba(24,24,27,0.12),transparent_32%),linear-gradient(180deg,#fafafa,#f4f4f5)] p-5 md:block">
            <div className="absolute inset-x-5 top-16 h-px bg-foreground/10" />
            <div className="absolute inset-y-5 right-16 w-px bg-foreground/10" />
            <div className="flex size-10 items-center justify-center rounded-xl border bg-background/70 shadow-sm backdrop-blur">
              <FileText className="size-4 text-foreground/80" strokeWidth={1.7} />
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Feeding Queue</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">{stats.total} 份</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.learned} 份已学会，{stats.pending} 份待确认
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricCard label="资料" value={`${stats.total} 份`} />
        <MetricCard label="知识片段" value={`${stats.chunks} 条`} />
        <MetricCard label="能力领域" value={`${stats.domains} 个`} />
      </div>

      <Card className="mt-5 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle className="text-base">最近喂过的资料</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {items.slice(0, 8).map((item) => {
            const Icon = getFileIcon(item.name);
            return (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 text-sm hover:bg-muted/60">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="truncate">{item.name}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <Badge variant={item.status === "learned" ? "secondary" : "outline"} className="gap-1.5">
                    {item.status === "learned" && <CheckCircle2 className="size-3" strokeWidth={1.8} />}
                    {statusText[item.status]}
                  </Badge>
                  <span>{item.chunks} 条知识</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl shadow-none">
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext ?? "")) return FileSpreadsheet;
  if (["zip", "rar", "7z"].includes(ext ?? "")) return FileArchive;
  return FileText;
}
