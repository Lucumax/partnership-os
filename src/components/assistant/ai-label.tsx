import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AiApprovalStatus = "approved" | "awaiting" | "rejected";

export interface AiLabelProps {
  label?: string;
  generatedAt?: string;
  modelId?: string;
  sources?: string[];
  uncertainty?: string;
  approvalStatus?: AiApprovalStatus;
  className?: string;
}

const APPROVAL_LABELS: Record<AiApprovalStatus, string> = {
  approved: "Approved",
  awaiting: "Awaiting approval",
  rejected: "Rejected",
};

export function AILabel({
  label = "AI draft",
  generatedAt,
  modelId,
  sources = [],
  uncertainty = "unknown",
  approvalStatus = "awaiting",
  className,
}: AiLabelProps) {
  const meta = [
    generatedAt,
    modelId,
    `${sources.length} source record${sources.length === 1 ? "" : "s"}`,
    `uncertainty: ${uncertainty}`,
  ].filter((segment): segment is string => segment !== undefined && segment !== "");

  return (
    <div className={cn("flex flex-col items-start gap-1 text-left", className)}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{label}</Badge>
        <span className="text-xs font-medium text-muted-foreground">
          {APPROVAL_LABELS[approvalStatus]}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{meta.join(" · ")}</span>
    </div>
  );
}
