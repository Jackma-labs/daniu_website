import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Brain, ClipboardList, Database, Settings2, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "问大牛 | 大牛控制台",
  description: "企业自己的本地 AI 专家。",
};

const navItems = [
  { label: "学习资料", href: "/app/learn", icon: BookOpen },
  { label: "大牛记忆", href: "/app/memory", icon: Brain },
  { label: "待学习", href: "/app/gaps", icon: ClipboardList },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/app" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" strokeWidth={1.8} />
          </span>
          <span className="leading-none">
            <span className="block text-sm font-medium">大牛</span>
            <span className="mt-1 block text-xs text-muted-foreground">企业本地 AI 专家</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" className="text-muted-foreground" nativeButton={false} render={<Link href={item.href} />}>
              <item.icon data-icon="inline-start" />
              {item.label}
            </Button>
          ))}
        </nav>

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
