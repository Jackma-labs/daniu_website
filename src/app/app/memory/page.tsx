import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  CircleDollarSign,
  FileStack,
  GraduationCap,
  ShieldCheck,
  UserRoundSearch,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const memories = [
  {
    title: "产品资料",
    count: "328",
    unit: "条",
    meta: "常被引用 126 次",
    level: "92%",
    icon: BookOpenText,
    tone: "bg-[radial-gradient(circle_at_20%_20%,rgba(15,23,42,0.10),transparent_32%),linear-gradient(180deg,#fafafa,#f4f4f5)]",
  },
  {
    title: "售后案例",
    count: "512",
    unit: "条",
    meta: "还有 9 个问题待学习",
    level: "86%",
    icon: Wrench,
    tone: "bg-[radial-gradient(circle_at_80%_18%,rgba(39,39,42,0.12),transparent_34%),linear-gradient(180deg,#fbfbfb,#f1f5f9)]",
  },
  {
    title: "报价规则",
    count: "86",
    unit: "条",
    meta: "建议本周更新",
    level: "74%",
    icon: CircleDollarSign,
    tone: "bg-[radial-gradient(circle_at_18%_80%,rgba(82,82,91,0.14),transparent_34%),linear-gradient(180deg,#fafafa,#f5f5f4)]",
  },
  {
    title: "项目方案",
    count: "147",
    unit: "条",
    meta: "最近更新 2 天前",
    level: "81%",
    icon: FileStack,
    tone: "bg-[radial-gradient(circle_at_76%_76%,rgba(63,63,70,0.14),transparent_34%),linear-gradient(180deg,#ffffff,#f4f4f5)]",
  },
  {
    title: "公司制度",
    count: "72",
    unit: "条",
    meta: "命中率 91%",
    level: "91%",
    icon: ShieldCheck,
    tone: "bg-[radial-gradient(circle_at_24%_24%,rgba(24,24,27,0.10),transparent_32%),linear-gradient(180deg,#fbfbfb,#f8fafc)]",
  },
  {
    title: "专家访谈",
    count: "39",
    unit: "条",
    meta: "来自 4 位专家",
    level: "69%",
    icon: UserRoundSearch,
    tone: "bg-[radial-gradient(circle_at_72%_26%,rgba(15,23,42,0.12),transparent_34%),linear-gradient(180deg,#fafafa,#f3f4f6)]",
  },
];

export default function MemoryPage() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-12 md:px-6 md:pt-16">
      <div className="w-full max-w-5xl">
        <div className="text-center">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <GraduationCap className="size-3" strokeWidth={1.8} />
            牛大脑
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">看看牛大脑里已经装了什么</h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
            这里不是文件夹，而是大牛对企业能力的掌握情况。每一张卡，都是一个可以继续追问、补充和训练的能力模块。
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((item) => (
            <Link
              key={item.title}
              href={`/app?topic=${encodeURIComponent(item.title)}`}
              className="group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`向大牛询问${item.title}`}
            >
              <Card className="gap-0 overflow-hidden rounded-2xl border-foreground/10 bg-card p-0 shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-foreground/5">
                <CardContent className="flex h-[330px] flex-col p-3.5">
                  <div className={`relative flex flex-1 flex-col overflow-hidden rounded-xl border border-foreground/10 p-4 ${item.tone}`}>
                    <div className="pointer-events-none absolute inset-x-4 top-16 h-px bg-foreground/10" />
                    <div className="pointer-events-none absolute inset-y-4 right-14 w-px bg-foreground/10" />
                    <div className="flex items-start justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl border bg-background/70 shadow-sm backdrop-blur">
                        <item.icon className="size-4.5 text-foreground/80" strokeWidth={1.6} />
                      </span>
                      <Badge variant="outline" className="rounded-full bg-background/60 px-2 text-[10px] backdrop-blur">
                        掌握 {item.level}
                      </Badge>
                    </div>

                    <div className="mt-auto">
                      <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Daniu Memory</div>
                      <div className="mt-2 flex items-end gap-1.5">
                        <strong className="text-4xl font-semibold tracking-tight">{item.count}</strong>
                        <span className="pb-1 text-sm font-medium text-muted-foreground">{item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 pt-3.5">
                    <div>
                      <h2 className="text-sm font-medium tracking-tight">{item.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
