import { FileArchive, FileSpreadsheet, FileText, FileUp, Sparkles, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recent = [
  ["产品手册_X9.pdf", "已学会", "128 条知识", FileText],
  ["售后故障案例.xlsx", "正在整理", "预计 3 分钟", FileSpreadsheet],
  ["报价规则.docx", "需要确认", "发现 4 处歧义", FileArchive],
];

export default function LearnPage() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-12 md:px-6 md:pt-16">
      <div className="w-full max-w-4xl">
        <div className="text-center">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <Sparkles className="size-3" strokeWidth={1.8} />
            让大牛学习资料
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">把资料拖进来，大牛会自己学习</h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
            产品手册、报价规则、故障案例、项目方案、图片、音频、视频，都可以成为大牛的学习材料。
          </p>
        </div>

        <Card className="mt-9 overflow-hidden rounded-3xl border-dashed border-foreground/15 bg-card p-0 shadow-sm">
          <CardContent className="grid gap-0 p-0 md:grid-cols-[1fr_280px]">
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl border bg-muted/60 shadow-sm">
                <UploadCloud className="size-6 text-foreground/70" strokeWidth={1.7} />
              </span>
              <div>
                <h2 className="text-xl font-medium tracking-tight">拖拽文件到这里</h2>
                <p className="mt-2 text-sm text-muted-foreground">支持 PDF / Word / PPT / Excel / 图片 / 音频 / 视频</p>
              </div>
              <Button className="mt-1 gap-1.5">
                <FileUp className="size-4" strokeWidth={1.8} />
                选择文件
              </Button>
            </div>

            <div className="relative hidden overflow-hidden border-l bg-[radial-gradient(circle_at_30%_20%,rgba(24,24,27,0.12),transparent_32%),linear-gradient(180deg,#fafafa,#f4f4f5)] p-5 md:block">
              <div className="absolute inset-x-5 top-16 h-px bg-foreground/10" />
              <div className="absolute inset-y-5 right-16 w-px bg-foreground/10" />
              <div className="flex size-10 items-center justify-center rounded-xl border bg-background/70 shadow-sm backdrop-blur">
                <FileText className="size-4 text-foreground/80" strokeWidth={1.7} />
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Learning Queue</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">3 份</div>
                <p className="mt-1 text-xs text-muted-foreground">最近上传资料等待整理</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5 rounded-2xl shadow-none">
          <CardHeader><CardTitle className="text-base">最近学习</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {recent.map(([name, status, meta, Icon]) => (
              <div key={name as string} className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 text-sm hover:bg-muted/60">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="truncate">{name as string}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <Badge variant="outline">{status as string}</Badge>
                  <span>{meta as string}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
