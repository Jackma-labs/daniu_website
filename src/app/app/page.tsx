import { AskConsole } from "@/components/app/ask-console";

export default function AskPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center px-4 pb-8 pt-8 md:px-6 md:pt-14">
      <AskConsole />
      <footer className="mt-8 flex w-full max-w-6xl items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
        <span>本地运行，数据不出企业内网。</span>
        <span>回答会尽量给出知识来源。</span>
      </footer>
    </div>
  );
}
