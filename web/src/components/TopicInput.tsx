/**
 * TopicInput — responsive form with theme-aware styling.
 */

import { useState, useEffect, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading: boolean;
  externalTopic?: string;
  onExternalTopicConsumed?: () => void;
}

export function TopicInput({ onSubmit, isLoading, externalTopic, onExternalTopicConsumed }: TopicInputProps) {
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (externalTopic) { setTopic(externalTopic); onExternalTopicConsumed?.(); }
  }, [externalTopic, onExternalTopicConsumed]);

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (topic.trim()) onSubmit(topic.trim()); };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="overflow-hidden rounded-lg" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Describe your Instagram post idea…"
          disabled={isLoading}
          rows={3}
          className="w-full resize-none bg-transparent px-4 py-3 text-[14px] outline-none leading-relaxed"
          style={{ color: "var(--c-text)", "--tw-placeholder-color": "var(--c-text-subtle)" } as React.CSSProperties}
        />
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--c-raised)", borderTop: "1px solid var(--c-border)" }}>
          <span className="hidden text-[12px] sm:inline" style={{ color: "var(--c-text-subtle)" }}>{topic.length} characters</span>
          <Button type="submit" isLoading={isLoading} disabled={!topic.trim()} icon={<Sparkles className="h-3.5 w-3.5" />}>
            {isLoading ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>
    </form>
  );
}
