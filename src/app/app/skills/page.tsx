import { LibraryBig, Sparkles } from "lucide-react";
import { DaniuLibrary } from "@/components/app/daniu-library";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function SkillsPage() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-10 md:px-6 md:pt-14">
      <div className="w-full max-w-6xl">
        <div className="text-center">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <LibraryBig data-icon="inline-start" strokeWidth={1.8} />
            大牛库
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">给大牛换一种思考方式</h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
            大牛库不是换模型，而是给同一个企业知识库增加不同专家视角。聊天页最多展示 3 个常用大牛。
          </p>
        </div>

        <Card className="mt-8 rounded-3xl border-dashed shadow-none">
          <CardContent className="flex flex-col gap-3 p-5 text-sm leading-7 text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium text-foreground">GitHub Skill 导入</div>
              <p>支持从 GitHub 仓库、目录、SKILL.md 或 README.md 导入。系统只吸收思考框架，不执行第三方代码。</p>
            </div>
            <Badge variant="outline" className="gap-1.5 rounded-full">
              <Sparkles data-icon="inline-start" strokeWidth={1.8} />
              已支持
            </Badge>
          </CardContent>
        </Card>

        <DaniuLibrary />
      </div>
    </section>
  );
}
