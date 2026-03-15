export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg p-10" style={{ background: "var(--c-surface)", border: "1px dashed var(--c-border)" }}>
      <div className="flex gap-2">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full" style={{ background: "var(--c-green)", animationDelay: "0ms" }} />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full" style={{ background: "var(--c-blue)", animationDelay: "150ms" }} />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full" style={{ background: "var(--c-purple)", animationDelay: "300ms" }} />
      </div>
      <p className="text-[13px] font-medium" style={{ color: "var(--c-text-muted)" }}>PostPilot AI is crafting your content…</p>
    </div>
  );
}
