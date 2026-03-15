/**
 * UsagePage — full-page wrapper around UsageTab for sidebar navigation.
 */

import { UsageTab } from "../components/tabs/UsageTab";

interface UsagePageProps {
  totalRequests: number;
  model: string;
  recentRequests: string[];
}

export function UsagePage({ totalRequests, model, recentRequests }: UsagePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Usage
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>
          Monitor your API usage, token consumption, and estimated costs.
        </p>
      </header>

      <UsageTab
        totalRequests={totalRequests}
        model={model}
        recentRequests={recentRequests}
      />
    </div>
  );
}
