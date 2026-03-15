/**
 * UsageTab — API usage statistics dashboard.
 */

import { Activity, Cpu, DollarSign, Layers, Clock } from "lucide-react";
import { UsageCard } from "./UsageCard";

interface UsageTabProps {
  /** Total requests made this session */
  totalRequests: number;
  /** Model name currently being used */
  model: string;
  /** History of topics generated */
  recentRequests: string[];
}

export function UsageTab({ totalRequests, model, recentRequests }: UsageTabProps) {
  const tokensEstimate = totalRequests * 1250;
  const costEstimate = (tokensEstimate / 1_000_000 * 3).toFixed(4);

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UsageCard icon={<Activity className="h-5 w-5" />} label="Total Requests" value={String(totalRequests)} accent="var(--c-blue)" />
        <UsageCard icon={<Layers className="h-5 w-5" />} label="Tokens Used" value={`~${tokensEstimate.toLocaleString()}`} accent="var(--c-purple)" />
        <UsageCard icon={<Cpu className="h-5 w-5" />} label="Model" value={model} accent="var(--c-green)" />
        <UsageCard icon={<DollarSign className="h-5 w-5" />} label="Est. Cost" value={`$${costEstimate}`} accent="var(--c-orange)" />
      </div>

      {/* Recent requests table */}
      <div
        className="overflow-hidden rounded-lg"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <Clock className="h-4 w-4" style={{ color: "var(--c-text-subtle)" }} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--c-text)" }}>Recent Requests</span>
          <span className="text-[12px]" style={{ color: "var(--c-text-subtle)" }}>({recentRequests.length})</span>
        </div>

        {recentRequests.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px]" style={{ color: "var(--c-text-subtle)" }}>
            No requests yet. Generate some content to see stats here.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border-muted)" }}>
            {recentRequests.slice(0, 8).map((topic, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "color-mix(in srgb, var(--c-blue) 15%, transparent)", color: "var(--c-blue)" }}
                >
                  {i + 1}
                </span>
                <span className="truncate" style={{ color: "var(--c-text-muted)" }}>{topic}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
