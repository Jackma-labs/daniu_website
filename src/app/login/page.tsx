import Link from "next/link";
import { ArrowRight, LockKeyhole, Server, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-background text-foreground md:grid-cols-[1fr_460px]">
      <section className="hidden flex-col justify-between border-r bg-[radial-gradient(circle_at_20%_20%,rgba(24,24,27,0.10),transparent_34%),linear-gradient(180deg,#fafafa,#f4f4f5)] p-8 md:flex">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" strokeWidth={1.8} />
          </span>
          <span className="leading-none">
            <span className="block text-sm font-medium">大牛</span>
            <span className="mt-1 block text-xs text-muted-foreground">企业本地 AI 专家</span>
          </span>
        </Link>

        <div className="max-w-xl">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <Server className="size-3" strokeWidth={1.8} />
            本地部署 · 数据不出企业内网
          </Badge>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight">把企业经验，留在自己手里。</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            登录后直接问大牛。产品、报价、故障、制度、项目经验，都先从企业自己的知识库里找答案。
          </p>
        </div>

        <p className="text-xs text-muted-foreground">Daniu Local AI Expert</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-sm shadow-xl shadow-foreground/5">
          <CardHeader className="text-center">
            <Badge variant="secondary" className="mx-auto gap-1.5 rounded-full px-3 py-1">
              <LockKeyhole className="size-3" strokeWidth={1.8} />
              企业账号登录
            </Badge>
            <CardTitle className="mt-4 text-2xl">进入大牛</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="account">账号</label>
                <Input id="account" placeholder="name@company.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">密码</label>
                <Input id="password" type="password" placeholder="请输入密码" />
              </div>
              <Button className="w-full" render={<Link href="/app" />}>
                登录
                <ArrowRight className="size-4" strokeWidth={1.8} />
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              当前为原型登录页，后续接入企业账号和设备授权。
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
