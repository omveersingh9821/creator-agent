import { MessageSquare } from "lucide-react";
import { Card } from "../ui/Card";
import { CopyButton } from "./CopyButton";

export function CaptionCard({ caption }: { caption: string }) {
  return (
    <Card title="Caption" icon={<MessageSquare className="h-4 w-4" style={{ color: "var(--c-pink)" }} />} accentColor="var(--c-pink)" action={<CopyButton text={caption} />}>
      <p className="whitespace-pre-wrap">{caption}</p>
    </Card>
  );
}
