/**
 * Tabs — generic horizontal tab strip with animated active indicator.
 */

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div
      className="flex gap-1 rounded-lg p-1"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-all duration-200"
            style={{
              background: isActive ? "var(--c-raised)" : "transparent",
              color: isActive ? "var(--c-text)" : "var(--c-text-muted)",
              border: isActive ? "1px solid var(--c-border)" : "1px solid transparent",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,.15)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "var(--c-raised)";
                e.currentTarget.style.color = "var(--c-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--c-text-muted)";
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
