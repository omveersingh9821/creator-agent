/**
 * UsagePage — fetches LIVE global usage stats from MongoDB via the API.
 */

import { useEffect, useState } from "react";
import { Activity, Cpu, DollarSign, Layers } from "lucide-react";
import { UsageCard } from "../components/tabs/UsageCard";
import { fetchUsage, type GlobalUsage } from "../services/api";

export function UsagePage() {
  const [usage, setUsage] = useState<GlobalUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage()
      .then(setUsage)
      .catch((err) => console.error("Failed to fetch usage:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Usage</h1>
          <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>Loading usage data...</p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--c-border-muted)", borderTopColor: "var(--c-green)" }} />
        </div>
      </div>
    );
  }

  const total = usage?.total_requests ?? 0;
  const tokens = usage?.total_tokens_estimated ?? 0;
  const cost = (usage?.estimated_cost_usd ?? 0).toFixed(4);
  const model = usage?.model ?? "—";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Usage</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>
          Monitor your API usage, token consumption, and estimated costs.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <UsageCard icon={<Activity className="h-5 w-5" />} label="Total Requests" value={String(total)} accent="var(--c-blue)" />
        <UsageCard icon={<Layers className="h-5 w-5" />} label="Tokens Used" value={`~${tokens.toLocaleString()}`} accent="var(--c-purple)" />
        <UsageCard icon={<Cpu className="h-5 w-5" />} label="Model" value={model} accent="var(--c-green)" />
        <UsageCard icon={<DollarSign className="h-5 w-5" />} label="Est. Cost" value={`$${cost}`} accent="var(--c-orange)" />
      </div>
    </div>
  );
}
