import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "大牛 | 企业专家资产一体机",
  description: "大牛把老师傅、专家和合作方手里的核心经验，沉淀成企业自己的 AI 专家。本地部署，数据不出门，员工随时问。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
