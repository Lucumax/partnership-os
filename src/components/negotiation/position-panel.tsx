import { AILabel } from "@/components/assistant/ai-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Recommendation } from "@/lib/domain/types";
import { formatUsdM } from "@/lib/export/format";

export interface PositionPanelProps {
  recommendation: Recommendation;
  scenarioCount: number;
  comparableCount: number;
}

export function PositionPanel({
  recommendation,
  scenarioCount,
  comparableCount,
}: PositionPanelProps) {
  const position = [
    {
      label: "Opening position",
      value: formatUsdM(recommendation.openingPositionUsd),
      hint: "Downside CAV",
    },
    {
      label: "Target",
      value: formatUsdM(recommendation.targetValueUsd),
      hint: "Midpoint base–upside",
    },
    {
      label: "Reservation value",
      value: formatUsdM(recommendation.reservationValueUsd),
      hint: "Base CAV",
    },
    {
      label: "Walk-away point",
      value: formatUsdM(recommendation.walkAwayValueUsd),
      hint: "Upside CAV",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where we stand</CardTitle>
        <CardDescription>Where we open, what we would accept, and where we walk away</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3">
          {position.map((row) => (
            <div key={row.label}>
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-xl font-semibold tabular-nums">{row.value}</dd>
              {row.hint ? (
                <dd className="text-xs text-muted-foreground">{row.hint}</dd>
              ) : null}
            </div>
          ))}
        </dl>
        <div>
          <p className="text-xs text-muted-foreground">Preferred structure</p>
          <p className="mt-1 text-sm">{recommendation.preferredStructure}</p>
        </div>
        <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <AILabel
            label="AI draft"
            modelId="deterministic-engine"
            sources={[`${scenarioCount} scenarios`, `${comparableCount} comparables`]}
            uncertainty="low"
            approvalStatus={recommendation.approvedBy ? "approved" : "awaiting"}
          />
          <span>{recommendation.generatedBy.replace(/_/g, " ")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
