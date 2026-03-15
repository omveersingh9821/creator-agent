import { FileText } from "lucide-react";
import { Card } from "../ui/Card";
import { CopyButton } from "./CopyButton";

export function BlogCard({ blog }: { blog: string }) {
  return (
    <Card title="Blog Post" icon={<FileText className="h-4 w-4" style={{ color: "var(--c-blue)" }} />} accentColor="var(--c-blue)" action={<CopyButton text={blog} />}>
      <div className="whitespace-pre-wrap">{blog}</div>
    </Card>
  );
}
