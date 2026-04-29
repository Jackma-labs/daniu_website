import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Brain, ClipboardList, Database, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "问大牛 | 大牛控制台",
  description: "企业自己的本地 AI 专家。",
};

const navItems = [
  { label: "学习资料", href: "/app/learn", icon: BookOpen },
  { label: "大牛记忆", href: "/app/memory", icon: Brain },
  { label: "待学习", href: "/app/gaps", icon: ClipboardList },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
            <Button key={item.href} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" render={<Link href={item.href} />}>
              <item.icon className="size-4" strokeWidth={1.8} />
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">
            <Database className="size-3" strokeWidth={1.8} />
            本地知识库已连接
          </Badge>
          <Button variant="ghost" size="icon-sm" aria-label="设置" render={<Link href="/app/settings" />}>
            <Settings2 className="size-4" strokeWidth={1.8} />
          </Button>
        </div>
      </header>
      {children}
    </main>
  );
}
