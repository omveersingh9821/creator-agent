import { Hash } from "lucide-react";
import { Card } from "../ui/Card";
import { CopyButton } from "./CopyButton";

export function HashtagCard({ hashtags }: { hashtags: string[] }) {
  return (
    <Card title="Hashtags" icon={<Hash className="h-4 w-4" style={{ color: "var(--c-purple)" }} />} accentColor="var(--c-purple)" action={<CopyButton text={hashtags.join(" ")} />}>
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((tag, i) => (
          <span key={i} className="inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ background: "color-mix(in srgb, var(--c-purple) 12%, transparent)", color: "var(--c-purple)", border: "1px solid color-mix(in srgb, var(--c-purple) 25%, transparent)" }}>
            {tag.startsWith("#") ? tag : `#${tag}`}
          </span>
        ))}
      </div>
    </Card>
  );
}
