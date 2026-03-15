/**
 * PromptItem — clickable prompt card with hover elevation and selected highlight.
 */

interface PromptItemProps {
  text: string;
  icon: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
}

export function PromptItem({ text, icon, selected = false, onClick }: PromptItemProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-lg p-3.5 text-left transition-all duration-200"
      style={{
        background: selected ? "color-mix(in srgb, var(--c-green) 10%, transparent)" : "var(--c-surface)",
        border: selected ? "1px solid var(--c-green-muted)" : "1px solid var(--c-border)",
        cursor: "pointer",
        transform: "translateY(0)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "var(--c-raised)";
          e.currentTarget.style.borderColor = "var(--c-text-subtle)";
        }
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = "var(--c-surface)";
          e.currentTarget.style.borderColor = "var(--c-border)";
        }
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{
          background: selected
            ? "color-mix(in srgb, var(--c-green) 20%, transparent)"
            : "color-mix(in srgb, var(--c-blue) 12%, transparent)",
          color: selected ? "var(--c-green)" : "var(--c-blue)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-snug" style={{ color: "var(--c-text)" }}>
          {text}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--c-text-subtle)" }}>
          Click to use this prompt
        </p>
      </div>
    </button>
  );
}
