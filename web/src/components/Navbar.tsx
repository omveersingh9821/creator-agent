/**
 * Navbar — top navigation bar with brand, theme toggle, and mobile menu.
 */

import { Sun, Moon, Menu, X, Zap } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface NavbarProps {
  /** Toggle sidebar visibility on mobile. */
  onToggleSidebar: () => void;
  /** Whether sidebar is currently open (mobile). */
  sidebarOpen: boolean;
}

export function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-4 lg:px-6"
      style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}
    >
      {/* Left: Hamburger + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-md p-1.5 lg:hidden"
          style={{ color: "var(--c-text-muted)" }}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "var(--c-green-muted)" }}
          >
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[15px] font-bold" style={{ color: "var(--c-text)" }}>
            PostPilot<span style={{ color: "var(--c-green)" }}>AI</span>
          </span>
        </div>
      </div>

      {/* Right: Theme toggle */}
      <button
        onClick={toggleTheme}
        className="cursor-pointer flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
        style={{
          color: "var(--c-text-muted)",
          border: "1px solid var(--c-border)",
          background: "var(--c-raised)",
        }}
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-4 w-4" style={{ color: "var(--c-orange)" }} />
            Light
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" style={{ color: "var(--c-purple)" }} />
            Dark
          </>
        )}
      </button>
    </header>
  );
}
