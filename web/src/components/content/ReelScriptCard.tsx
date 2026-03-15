import { Clapperboard } from "lucide-react";
import { Card } from "../ui/Card";
import { CopyButton } from "./CopyButton";

export function ReelScriptCard({ script }: { script: string }) {
  const lines = script.split("\n");
  return (
    <Card title="Reel Script" icon={<Clapperboard className="h-4 w-4" style={{ color: "var(--c-orange)" }} />} accentColor="var(--c-orange)" action={<CopyButton text={script} />}>
      <div className="space-y-1">
        {lines.map((line, i) => {
          const isScene = line.toLowerCase().includes("scene");
          return <div key={i} className={isScene ? "rounded-r px-3 py-1" : ""} style={isScene ? { borderLeft: "2px solid var(--c-orange)", background: "color-mix(in srgb, var(--c-orange) 8%, transparent)" } : {}}>{line}</div>;
        })}
      </div>
    </Card>
  );
}
