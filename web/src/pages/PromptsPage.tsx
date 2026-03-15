/**
 * PromptsPage — full-page wrapper around PromptsTab for sidebar navigation.
 */

import { PromptsTab } from "../components/tabs/PromptsTab";

interface PromptsPageProps {
  onSelectPrompt: (prompt: string) => void;
  recentPrompts: string[];
}

export function PromptsPage({ onSelectPrompt, recentPrompts }: PromptsPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Prompts
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--c-text-muted)" }}>
          Browse recommended prompts or click one to auto-fill the workspace.
        </p>
      </header>

      <PromptsTab
        onSelectPrompt={onSelectPrompt}
        recentPrompts={recentPrompts}
      />
    </div>
  );
}
