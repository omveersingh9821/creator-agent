import { Image } from "lucide-react";
import { Card } from "../ui/Card";
import { CopyButton } from "./CopyButton";

export function ImageIdeaCard({ idea }: { idea: string }) {
  return (
    <Card title="Image Idea" icon={<Image className="h-4 w-4" style={{ color: "var(--c-cyan)" }} />} accentColor="var(--c-cyan)" action={<CopyButton text={idea} />}>
      <p className="whitespace-pre-wrap">{idea}</p>
    </Card>
  );
}
