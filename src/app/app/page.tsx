import {
  ArrowUp,
  BookOpenCheck,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FileUp,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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

export default function AskPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-8 pt-8 md:px-6 md:pt-14">
      <section className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
          <Sparkles className="size-3" strokeWidth={1.8} />
          本地模型 + 企业知识库
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">问大牛</h1>
        <p className="mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
          把老师傅、专家和项目经验沉淀进企业自己的 AI。问产品、问报价、问故障、问制度，先让大牛给答案。
        </p>

        <Card className="mt-8 w-full gap-0 rounded-2xl border-foreground/10 bg-card p-0 shadow-xl shadow-foreground/5">
          <CardContent className="p-3">
            <Textarea
              rows={4}
              className="min-h-32 resize-none border-0 bg-transparent px-3 py-3 text-base leading-7 shadow-none focus-visible:ring-0 md:text-base"
              placeholder="直接问大牛，或者上传资料让它学习。"
            />
            <div className="mt-2 flex items-center justify-between gap-3 border-t px-1 pb-1 pt-3">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <FileUp className="size-4" strokeWidth={1.8} />
                上传资料让它学
              </Button>
              <Button size="icon" aria-label="发送">
                <ArrowUp className="size-4" strokeWidth={1.8} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
          {examples.map((item) => (
            <Button
              key={item.text}
              variant="outline"
              className="h-auto justify-start gap-2 rounded-xl px-4 py-3 text-left text-sm font-normal text-muted-foreground"
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

      <footer className="mt-8 flex w-full max-w-3xl items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
        <span>本地运行，数据不出企业内网。</span>
        <span>回答会尽量给出知识来源。</span>
      </footer>
    </div>
  );
}
