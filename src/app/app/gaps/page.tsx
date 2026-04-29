import Link from "next/link";
import { ArrowUpRight, ClipboardList, FilePlus2, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const gaps = [
  ["A 型和 B 型设备有什么区别？", "缺少新旧型号对比资料", "建议上传产品对比表"],
  ["华东区域报价折扣怎么定？", "缺少最新区域报价规则", "建议销售负责人补充说明"],
  ["设备 E17 报警怎么处理？", "没有找到对应排障案例", "建议让售后专家回答一次"],
];

export default function GapsPage() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-12 md:px-6 md:pt-16">
      <div className="w-full max-w-4xl">
        <div className="text-center">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <ClipboardList className="size-3" strokeWidth={1.8} />
            待学习
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">问不准的地方，就是下一步要教它的地方</h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
            大牛会把低置信、无来源、用户反馈不准确的问题自动整理出来，方便老板知道企业还缺哪块知识资产。
          </p>
        </div>

        <div className="mt-9 grid gap-3">
          {gaps.map(([question, reason, action], index) => (
            <Card key={question} className="group overflow-hidden rounded-2xl p-0 shadow-none transition hover:shadow-md hover:shadow-foreground/5">
              <CardContent className="grid gap-0 p-0 md:grid-cols-[120px_1fr]">
                <div className="relative hidden overflow-hidden border-r bg-[radial-gradient(circle_at_30%_20%,rgba(24,24,27,0.12),transparent_34%),linear-gradient(180deg,#fafafa,#f4f4f5)] p-4 md:block">
                  <div className="absolute inset-x-4 top-14 h-px bg-foreground/10" />
                  <div className="absolute inset-y-4 right-8 w-px bg-foreground/10" />
                  <span className="flex size-10 items-center justify-center rounded-xl border bg-background/70 shadow-sm backdrop-blur">
                    <SearchX className="size-4 text-foreground/80" strokeWidth={1.7} />
                  </span>
                  <div className="absolute bottom-4 left-4 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Gap {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-medium tracking-tight">{question}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
                    <Badge variant="outline" className="mt-3 rounded-full">{action}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="secondary" nativeButton={false} render={<Link href="/app/learn" />}>
                      <FilePlus2 data-icon="inline-start" />
                      补资料
                    </Button>
                    <Button variant="outline" size="icon-sm" aria-label="去补资料" nativeButton={false} render={<Link href="/app/learn" />}>
                      <ArrowUpRight />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
