import { BadgeCheck, Brain, Database, KeyRound, Route, Server, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProviderStatuses } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

const settings = [
  { title: "大牛盒", text: "运行正常 · 本地地址 192.168.1.88", icon: Server },
  { title: "用户权限", text: "管理员 2 人 · 普通用户 46 人", icon: ShieldCheck },
  { title: "知识库", text: "1,248 份资料 · RAG 已启用", icon: Database },
];

export default function SettingsPage() {
  const providers = getProviderStatuses();

  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-12 md:px-6 md:pt-16">
      <div className="w-full max-w-5xl">
        <div className="text-center">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <KeyRound className="size-3" strokeWidth={1.8} />
            设置
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">少量必要设置</h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-muted-foreground">
            设备、权限和模型配置放在这里。日常使用只需要打开问大牛。
          </p>
        </div>

        <div className="mt-9 grid gap-3 md:grid-cols-3">
          {settings.map((item) => (
            <Card key={item.title} className="rounded-2xl shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <item.icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
              </CardHeader>
              <CardContent><p className="text-sm leading-7 text-muted-foreground">{item.text}</p></CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-4 overflow-hidden rounded-3xl p-0 shadow-sm">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[260px_1fr]">
            <div className="relative overflow-hidden border-r bg-[radial-gradient(circle_at_30%_20%,rgba(24,24,27,0.12),transparent_34%),linear-gradient(180deg,#fafafa,#f4f4f5)] p-5">
              <div className="absolute inset-x-5 top-16 h-px bg-foreground/10" />
              <div className="absolute inset-y-5 right-16 w-px bg-foreground/10" />
              <span className="flex size-10 items-center justify-center rounded-xl border bg-background/70 shadow-sm backdrop-blur">
                <Brain className="size-4 text-foreground/80" strokeWidth={1.7} />
              </span>
              <div className="mt-28">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Model Router</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">模型服务</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Auto 只表示自动路由，优先级由 DANIU_AUTO_PROVIDER_ORDER 配置。</p>
              </div>
            </div>

            <div className="divide-y">
              {providers.map((provider) => (
                <div key={provider.provider} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium">{provider.label}</h3>
                      <Badge variant={provider.configured ? "secondary" : "outline"} className="gap-1.5 rounded-full">
                        {provider.configured ? <BadgeCheck className="size-3" strokeWidth={1.8} /> : <Route className="size-3" strokeWidth={1.8} />}
                        {provider.configured ? "已配置" : "未配置"}
                      </Badge>
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">{provider.baseUrl}{provider.endpoint}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="rounded-full">优先级 {provider.priority}</Badge>
                    <Badge variant="outline" className="rounded-full">{provider.model}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
