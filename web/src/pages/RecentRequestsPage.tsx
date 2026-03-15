/**
 * RecentRequestsPage — full-page view of recent generation requests.
 */

import { Clock, ArrowRight } from "lucide-react";

interface RecentRequestsPageProps {
  requests: string[];
  onSelectTopic: (topic: string) => void;
}

export function RecentRequestsPage({ requests, onSelectTopic }: RecentRequestsPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Recent Requests
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>
          Your latest content generation requests. Click any item to re-use it.
        </p>
      </header>

      {/* List */}
      <div
        className="overflow-hidden rounded-lg"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <Clock className="h-4 w-4" style={{ color: "var(--c-text-subtle)" }} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--c-text)" }}>
            All Requests
          </span>
          <span className="text-[12px]" style={{ color: "var(--c-text-subtle)" }}>
            ({requests.length})
          </span>
        </div>

        {requests.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--c-text-subtle)" }}>
            No requests yet. Go to <strong>Workspace</strong> and generate some content.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border-muted)" }}>
            {requests.map((topic, i) => (
              <button
                key={i}
                onClick={() => onSelectTopic(topic)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] transition-colors"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "color-mix(in srgb, var(--c-blue) 15%, transparent)", color: "var(--c-blue)" }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate" style={{ color: "var(--c-text-muted)" }}>
                  {topic}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--c-text-subtle)" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
