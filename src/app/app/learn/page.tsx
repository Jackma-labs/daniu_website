import { Sparkles } from "lucide-react";
import { LearnConsole } from "@/components/app/learn-console";
import { Badge } from "@/components/ui/badge";
import { getKnowledgeStats, getPublicKnowledgeItems } from "@/lib/knowledge/store";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const [items, stats] = await Promise.all([getPublicKnowledgeItems(), getKnowledgeStats()]);

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

        <LearnConsole initialItems={items} initialStats={stats} />
      </div>
    </section>
  );
}
