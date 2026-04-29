import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const settings = [
  ["大牛盒", "运行正常 · 本地地址 192.168.1.88"],
  ["用户权限", "管理员 2 人 · 普通用户 46 人"],
  ["模型服务", "企业专属模型运行中 · RAG 已启用"],
];

export default function SettingsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-14 md:py-20">
      <div className="text-center">
        <Badge variant="secondary">设置</Badge>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">少量必要设置</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">设备、权限和模型配置放在这里，默认不打扰日常使用。</p>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {settings.map(([title, text]) => (
          <Card key={title} className="shadow-none">
            <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-7 text-muted-foreground">{text}</p></CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
