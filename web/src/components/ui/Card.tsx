import type { ReactNode } from "react";

interface CardProps { title: string; icon?: ReactNode; accentColor?: string; children: ReactNode; action?: ReactNode; }

export function Card({ title, icon, accentColor = "var(--c-green)", children, action }: CardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg transition-all duration-200"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--c-text-subtle)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-border)"; }}
    >
      <div className="h-0.5 w-full" style={{ background: accentColor }} />
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>{icon}{title}</div>
        {action}
      </div>
      <div className="px-4 pb-4 text-[13px] leading-relaxed" style={{ color: "var(--c-text-muted)" }}>{children}</div>
    </div>
  );
}
