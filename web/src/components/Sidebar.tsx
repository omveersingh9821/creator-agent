/**
 * Sidebar — responsive, collapsible on mobile via overlay.
 */

import {
  LayoutDashboard,
  Settings,
  History,
  BookOpen,
  BarChart3,
} from "lucide-react";

interface SidebarProps {
  onSelectTopic?: (topic: string) => void;
  history?: string[];
  /** Whether the sidebar is open (mobile). */
  open: boolean;
  /** Close the sidebar (mobile). */
  onClose: () => void;
}

export function Sidebar({ onSelectTopic, history = [], open, onClose }: SidebarProps) {
  const displayHistory =
    history.length > 0
      ? history
      : ["AI Agents for Business", "Morning Routine Reel", "Productivity Hacks", "Podcast Teaser"];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col transition-transform duration-300
          lg:relative lg:z-auto lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "var(--c-surface)", borderRight: "1px solid var(--c-border)" }}
      >
        {/* ── Nav Links ── */}
        <nav className="mt-4 flex flex-col gap-0.5 px-2">
          <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Workspace" active />
          <NavItem icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
          <NavItem icon={<BookOpen className="h-4 w-4" />} label="Templates" />
          <NavItem icon={<Settings className="h-4 w-4" />} label="Settings" />
        </nav>

        {/* ── History ── */}
        <div className="mt-4 flex flex-1 flex-col gap-1.5 overflow-y-auto px-3">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-subtle)" }}>
            <History className="h-3 w-3" />
            Recent
          </div>
          {displayHistory.map((item, i) => (
            <button
              key={i}
              onClick={() => { onSelectTopic?.(item); onClose(); }}
              className="truncate rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors"
              style={{ color: "var(--c-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--c-overlay)";
                e.currentTarget.style.color = "var(--c-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--c-text-muted)";
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active = false }: {
  icon: React.ReactNode; label: string; active?: boolean;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors"
      style={{
        background: active ? "var(--c-overlay)" : "transparent",
        color: active ? "var(--c-text)" : "var(--c-text-muted)",
        border: active ? "1px solid var(--c-border)" : "1px solid transparent",
      }}
    >
      {icon}
      {label}
    </div>
  );
}
