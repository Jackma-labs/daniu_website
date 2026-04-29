import type { Metadata } from "next";
import Link from "next/link";
import { Database, Settings2, Sparkles } from "lucide-react";
import { AppNav } from "@/components/app/app-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "问大牛 | 大牛控制台",
  description: "企业自己的本地 AI 专家。",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <main className="min-h-dvh bg-background pb-20 text-foreground md:pb-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <Link href="/app" className="flex items-center gap-3" aria-label="回到问大牛">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" strokeWidth={1.8} />
          </span>
          <span className="leading-none">
            <span className="block text-sm font-medium">大牛</span>
            <span className="mt-1 block text-xs text-muted-foreground">企业本地 AI 专家</span>
          </span>
        </Link>

        <AppNav />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">
            <Database className="size-3" strokeWidth={1.8} />
            本地知识库已连接
          </Badge>
          <Button variant="ghost" size="icon-sm" aria-label="设置" nativeButton={false} render={<Link href="/app/settings" />}>
            <Settings2 />
          </Button>
          {user ? (
            <Link href="/app/profile" aria-label="个人中心">
              <Avatar size="sm">
                <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
              登录
            </Button>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
