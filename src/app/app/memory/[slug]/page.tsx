import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenText, CheckCircle2, Clock3, FileText, MessageCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getKnowledgeChunks, getPublicKnowledgeItems } from "@/lib/knowledge/store";
import { getMemoryCategory, memoryCategories } from "@/lib/knowledge/memory-categories";

export const dynamic = "force-dynamic";

type MemoryDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const statusText = {
  learned: "已学会",
  processing: "整理中",
  needs_review: "待确认",
};

export function generateStaticParams() {
  return memoryCategories.map((category) => ({ slug: category.slug }));
}

export default async function MemoryDetailPage({ params }: MemoryDetailPageProps) {
  const { slug } = await params;
  const category = getMemoryCategory(slug);

  if (!category) {
    notFound();
  }

  const [items, chunks] = await Promise.all([getPublicKnowledgeItems(), getKnowledgeChunks()]);
  const categoryItems = items.filter((item) => item.domain === category.title);
  const categoryChunks = chunks.filter((chunk) => chunk.domain === category.title);
  const learnedCount = categoryItems.filter((item) => item.status === "learned").length;
  const reviewCount = categoryItems.filter((item) => item.status !== "learned").length;

  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-8 md:px-6 md:pt-10">
      <div className="w-full max-w-6xl">
        <Button variant="ghost" size="sm" className="mb-6" nativeButton={false} render={<Link href="/app/memory" />}>
          <ArrowLeft data-icon="inline-start" />
          返回牛大脑
        </Button>

        <Card className="overflow-hidden rounded-3xl p-0 shadow-sm">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-6 md:p-8">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <BookOpenText className="size-3" strokeWidth={1.8} />
                {category.title}
              </Badge>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">{category.title}大脑</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{category.description}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Metric title="已喂资料" value={`${categoryItems.length || category.count} 份`} />
                <Metric title="知识片段" value={`${categoryChunks.length || category.count} 条`} />
                <Metric title="掌握程度" value={category.level} />
              </div>
            </div>

            <div className="border-t bg-muted/30 p-6 lg:border-l lg:border-t-0 md:p-8">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">What Daniu Knows</div>
              <div className="mt-5 flex flex-wrap gap-2">
                {category.focus.map((item) => (
                  <Badge key={item} variant="outline" className="rounded-full bg-background">
                    {item}
                  </Badge>
                ))}
              </div>
              <Separator className="my-6" />
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">已学会</span>
                <span className="font-medium">{learnedCount} 份</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">待确认</span>
                <span className="font-medium">{reviewCount} 份</span>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button nativeButton={false} render={<Link href="/app/learn" />}>
                  <Upload data-icon="inline-start" />
                  继续喂资料
                </Button>
                <Button variant="outline" nativeButton={false} render={<Link href={`/app?topic=${encodeURIComponent(category.title)}`} />}>
                  <MessageCircle data-icon="inline-start" />
                  问问这类资料
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-3xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">这个模块里的资料</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {categoryItems.length ? (
                categoryItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" strokeWidth={1.8} />
                        <h2 className="truncate text-sm font-medium">{item.name}</h2>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={item.status === "learned" ? "secondary" : "outline"} className="gap-1.5 rounded-full">
                        {item.status === "learned" ? <CheckCircle2 className="size-3" strokeWidth={1.8} /> : <Clock3 className="size-3" strokeWidth={1.8} />}
                        {statusText[item.status]}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {item.chunks} 条知识
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm leading-7 text-muted-foreground">
                  还没有喂过这类资料。先上传资料，大牛会自动整理到对应能力模块。
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-none">
            <CardHeader>
              <CardTitle className="text-base">可追问的知识片段</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {categoryChunks.slice(0, 6).map((chunk) => (
                <div key={chunk.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{chunk.itemName}</span>
                    <Badge variant="outline" className="rounded-full">
                      片段 {chunk.index}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{chunk.text}</p>
                </div>
              ))}
              {!categoryChunks.length ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm leading-7 text-muted-foreground">资料整理后，这里会展示可被大牛引用的关键片段。</div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card className="rounded-2xl shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
