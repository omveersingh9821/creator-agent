/**
 * PromptsTab — recommended prompts grid + recent prompts list.
 */

import { useState } from "react";
import {
  Instagram,
  Film,
  Camera,
  Hash,
  Sparkles,
  Lightbulb,
  History,
} from "lucide-react";
import { PromptItem } from "./PromptItem";

const RECOMMENDED_PROMPTS = [
  { text: "Create an Instagram post about AI trends", icon: <Instagram className="h-4 w-4" /> },
  { text: "Generate a reel script about productivity", icon: <Film className="h-4 w-4" /> },
  { text: "Write a caption for a travel photo", icon: <Camera className="h-4 w-4" /> },
  { text: "Suggest hashtags for a tech startup", icon: <Hash className="h-4 w-4" /> },
  { text: "Generate a positive motivational post", icon: <Sparkles className="h-4 w-4" /> },
  { text: "Write a story-driven carousel post about coding", icon: <Lightbulb className="h-4 w-4" /> },
];

interface PromptsTabProps {
  onSelectPrompt: (prompt: string) => void;
  recentPrompts: string[];
}

export function PromptsTab({ onSelectPrompt, recentPrompts }: PromptsTabProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleClick = (idx: number, text: string) => {
    setSelectedIdx(idx);
    onSelectPrompt(text);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Recommended Prompts ── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-subtle)" }}>
          Recommended Prompts
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED_PROMPTS.map((prompt, i) => (
            <PromptItem
              key={i}
              text={prompt.text}
              icon={prompt.icon}
              selected={selectedIdx === i}
              onClick={() => handleClick(i, prompt.text)}
            />
          ))}
        </div>
      </div>

      {/* ── Recent Prompts ── */}
      <div
        className="overflow-hidden rounded-lg"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <History className="h-4 w-4" style={{ color: "var(--c-text-subtle)" }} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--c-text)" }}>Recent Prompts</span>
        </div>

        {recentPrompts.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px]" style={{ color: "var(--c-text-subtle)" }}>
            No recent prompts yet. Try one of the suggestions above!
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border-muted)" }}>
            {recentPrompts.slice(0, 6).map((prompt, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt(prompt)}
                className="cursor-pointer flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--c-raised)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: "color-mix(in srgb, var(--c-purple) 15%, transparent)", color: "var(--c-purple)" }}
                >
                  {i + 1}
                </span>
                <span className="truncate" style={{ color: "var(--c-text-muted)" }}>{prompt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
