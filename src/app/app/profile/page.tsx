import { BadgeCheck, Brain, Database, KeyRound, Server, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  ["角色", "企业管理员", ShieldCheck],
  ["设备", "大牛盒 · 在线", Server],
  ["知识库", "1,248 份资料", Database],
  ["模型", "本地 + MiniMax", Brain],
];

export default function ProfilePage() {
  return (
    <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-12 pt-12 md:px-6 md:pt-16">
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden rounded-3xl p-0 shadow-xl shadow-foreground/5">
          <CardContent className="grid gap-0 p-0 md:grid-cols-[280px_1fr]">
            <div className="relative overflow-hidden border-r bg-[radial-gradient(circle_at_30%_20%,rgba(24,24,27,0.12),transparent_34%),linear-gradient(180deg,#fafafa,#f4f4f5)] p-6">
              <div className="absolute inset-x-6 top-24 h-px bg-foreground/10" />
              <div className="absolute inset-y-6 right-20 w-px bg-foreground/10" />
              <Avatar size="lg" className="size-14">
                <AvatarFallback>牛</AvatarFallback>
              </Avatar>
              <div className="mt-28">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Account</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">管理员</h1>
                <p className="mt-2 text-sm text-muted-foreground">大牛企业控制台</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                    <UserRound className="size-3" strokeWidth={1.8} />
                    个人中心
                  </Badge>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">账号与权限</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">查看当前账号、设备授权和模型服务状态。</p>
                </div>
                <Badge variant="outline" className="gap-1.5 rounded-full">
                  <BadgeCheck className="size-3" strokeWidth={1.8} />
                  已授权
                </Badge>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {stats.map(([label, value, Icon]) => (
                  <Card key={label as string} className="shadow-none">
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm text-muted-foreground">{label as string}</CardTitle>
                      <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-base font-medium">{value as string}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-4 shadow-none">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl border bg-muted/50">
                      <KeyRound className="size-4" strokeWidth={1.8} />
                    </span>
                    <div>
                      <div className="text-sm font-medium">安全设置</div>
                      <p className="text-xs text-muted-foreground">后续接入密码修改、二次验证和登录审计。</p>
                    </div>
                  </div>
                  <Badge variant="outline">规划中</Badge>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
