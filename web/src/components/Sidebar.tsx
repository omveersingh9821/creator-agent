/**
 * Sidebar — responsive, collapsible on mobile via overlay.
 * Nav items: Workspace, Image Generation, Usage, Prompts, Recent Requests, Settings.
 * Uses react-router-dom for URL-based navigation.
 */

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  MessageSquareText,
  History,
  Settings,
  ImagePlus,
  PlaneTakeoff,
} from "lucide-react";

export type PageId = "workspace" | "image-generation" | "travel" | "usage" | "prompts" | "recent";

/** Map each page ID to its URL path. */
const PAGE_PATHS: Record<PageId, string> = {
  workspace: "/",
  "image-generation": "/image-generation",
  travel: "/travel",
  usage: "/usage",
  prompts: "/prompts",
  recent: "/recent",
};

/** Reverse mapping from path to page ID. */
function getActivePageFromPath(pathname: string): PageId {
  for (const [id, path] of Object.entries(PAGE_PATHS)) {
    if (path === pathname) return id as PageId;
  }
  return "workspace";
}

interface SidebarProps {
  /** Whether the sidebar is open (mobile). */
  open: boolean;
  /** Close the sidebar (mobile). */
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = getActivePageFromPath(location.pathname);

  const go = (page: PageId) => {
    navigate(PAGE_PATHS[page]);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="cursor-pointer fixed inset-0 z-30 bg-black/50 lg:hidden"
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
          <NavItem icon={<ImagePlus className="h-4 w-4" />} label="Image Generation" active={activePage === "image-generation"} onClick={() => go("image-generation")} />
          <NavItem icon={<PlaneTakeoff className="h-4 w-4" />} label="Travel Agent" active={activePage === "travel"} onClick={() => go("travel")} />

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

        {/* ── User Profile & Logout ── */}
        <div className="mt-auto p-4" style={{ borderTop: "1px solid var(--c-border)" }}>
          <UserProfile />
        </div>
      </aside>
    </>
  );
}

import { LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

function UserProfile() {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-white uppercase" style={{ background: "var(--c-purple)", border: "2px solid var(--c-border)" }}>
        {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <span className="truncate text-[13px] font-semibold" style={{ color: "var(--c-text)" }}>
          {user.displayName || "Creator AI User"}
        </span>
        <span className="truncate text-[11px]" style={{ color: "var(--c-text-subtle)" }}>
          {user.email}
        </span>
      </div>
      <button 
        onClick={() => logout()}
        className="cursor-pointer shrink-0 p-1.5 rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--c-red)_15%,transparent)] hover:text-[var(--c-red)]"
        style={{ color: "var(--c-text-subtle)" }}
        title="Log out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
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
