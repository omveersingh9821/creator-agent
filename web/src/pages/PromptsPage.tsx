/**
 * PromptsPage — recommended prompts + recent prompts fetched from MongoDB.
 */

import { useEffect, useState } from "react";
import { PromptsTab } from "../components/tabs/PromptsTab";
import { useAuth } from "../auth/AuthContext";
import { fetchUserRequests } from "../services/api";

interface PromptsPageProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptsPage({ onSelectPrompt }: PromptsPageProps) {
  const { user } = useAuth();
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    fetchUserRequests(user.uid)
      .then((res) => setRecentPrompts((res.recent_requests ?? []).map((r) => r.topic)))
      .catch((err) => console.error("Failed to fetch recent prompts:", err));
  }, [user?.uid]);

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
