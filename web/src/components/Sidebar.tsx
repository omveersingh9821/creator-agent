/**
 * Sidebar — responsive, collapsible on mobile via overlay.
 * Nav items: Workspace, Usage, Prompts, Recent Requests, Settings.
 * Clicking a nav item fires onNavigate to switch the main page.
 */

import {
  LayoutDashboard,
  BarChart3,
  MessageSquareText,
  History,
  Settings,
} from "lucide-react";

export type PageId = "workspace" | "usage" | "prompts" | "recent";

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  /** Whether the sidebar is open (mobile). */
  open: boolean;
  /** Close the sidebar (mobile). */
  onClose: () => void;
}

export function Sidebar({ activePage, onNavigate, open, onClose }: SidebarProps) {
  const go = (page: PageId) => {
    onNavigate(page);
    onClose();
  };

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
        {/* ── Navigation ── */}
        <nav className="mt-4 flex flex-col gap-0.5 px-2">
          {/* Main */}
          <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-subtle)" }}>
            Main
          </div>
          <NavItem icon={<LayoutDashboard className="h-4 w-4" />} label="Workspace" active={activePage === "workspace"} onClick={() => go("workspace")} />

          {/* Insights */}
          <div className="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-subtle)" }}>
            Insights
          </div>
          <NavItem icon={<BarChart3 className="h-4 w-4" />} label="Usage" active={activePage === "usage"} onClick={() => go("usage")} />
          <NavItem icon={<MessageSquareText className="h-4 w-4" />} label="Prompts" active={activePage === "prompts"} onClick={() => go("prompts")} />
          <NavItem icon={<History className="h-4 w-4" />} label="Recent Requests" active={activePage === "recent"} onClick={() => go("recent")} />

          {/* System */}
          <div className="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-subtle)" }}>
            System
          </div>
          <NavItem icon={<Settings className="h-4 w-4" />} label="Settings" active={false} onClick={() => {}} />
        </nav>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active = false, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors"
      style={{
        background: active ? "var(--c-overlay)" : "transparent",
        color: active ? "var(--c-text)" : "var(--c-text-muted)",
        border: active ? "1px solid var(--c-border)" : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--c-overlay)";
          e.currentTarget.style.color = "var(--c-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--c-text-muted)";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}
