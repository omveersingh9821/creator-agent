import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-3 text-[12px]" style={{ borderTop: "1px solid var(--c-border)", color: "var(--c-text-subtle)" }}>
      <div className="flex items-center gap-2">
        <Github className="h-3.5 w-3.5" />
        <span>PostPilot AI © {new Date().getFullYear()}</span>
      </div>
      <div className="flex gap-4">
        <span className="cursor-pointer transition-colors hover:underline">Docs</span>
        <span className="cursor-pointer transition-colors hover:underline">API</span>
        <span className="cursor-pointer transition-colors hover:underline">Privacy</span>
      </div>
    </footer>
  );
}
