import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "../../utils/format";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { const ok = await copyToClipboard(text); if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  return (
    <button onClick={handleCopy} className="rounded-md p-1.5 transition-all" style={{ color: copied ? "var(--c-green)" : "var(--c-text-subtle)", border: "1px solid var(--c-border)", background: "var(--c-raised)" }} title="Copy to clipboard">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
