import { FileText, Hash, Clapperboard, Image } from "lucide-react";

interface StatsBarProps { hasContent: boolean; }

export function StatsBar({ hasContent }: StatsBarProps) {
  const stats = [
    { label: "Caption", icon: FileText, color: "var(--c-pink)" },
    { label: "Hashtags", icon: Hash, color: "var(--c-purple)" },
    { label: "Reel Script", icon: Clapperboard, color: "var(--c-orange)" },
    { label: "Image Idea", icon: Image, color: "var(--c-cyan)" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-lg px-4 py-3" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      {stats.map(({ label, icon: Icon, color }) => (
        <div key={label} className="flex items-center gap-1.5 text-[12px] sm:text-[13px]">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: hasContent ? color : "var(--c-text-subtle)" }} />
          <span className="hidden sm:inline" style={{ color: hasContent ? "var(--c-text)" : "var(--c-text-subtle)" }}>{label}</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: hasContent ? "var(--c-green)" : "var(--c-text-subtle)" }} />
        </div>
      ))}
    </div>
  );
}
