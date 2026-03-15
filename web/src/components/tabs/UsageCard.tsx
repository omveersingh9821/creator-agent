/**
 * UsageCard — small stat card for the Usage dashboard.
 */

interface UsageCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}

export function UsageCard({ icon, label, value, accent = "var(--c-blue)" }: UsageCardProps) {
  return (
    <div
      className="group flex items-center gap-3.5 rounded-lg p-4 transition-all duration-200"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-border)"; }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium" style={{ color: "var(--c-text-subtle)" }}>{label}</p>
        <p className="mt-0.5 text-[18px] font-bold leading-snug" style={{ color: "var(--c-text)" }}>{value}</p>
      </div>
    </div>
  );
}
