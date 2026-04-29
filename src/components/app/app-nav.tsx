"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Brain, ClipboardList, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "问大牛", href: "/app", icon: MessageCircle },
  { label: "喂资料", href: "/app/learn", icon: BookOpen },
  { label: "牛大脑", href: "/app/memory", icon: Brain },
  { label: "待学习", href: "/app/gaps", icon: ClipboardList },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              className={cn(!active && "text-muted-foreground")}
              nativeButton={false}
              render={<Link href={item.href} aria-current={active ? "page" : undefined} />}
            >
              <item.icon data-icon="inline-start" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border bg-background/95 p-1 shadow-xl shadow-foreground/10 backdrop-blur md:hidden"
        aria-label="移动端主导航"
      >
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium text-muted-foreground transition",
                active && "bg-secondary text-foreground"
              )}
            >
              <item.icon className="size-4" strokeWidth={1.8} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
