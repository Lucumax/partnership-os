"use client";

import { ApprovalAwareAiLabel } from "@/components/approval/approval-context";
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
      hint: "Downside-case value (present terms) — the lowest number we can defend",
    },
    {
      label: "Target",
      value: formatUsdM(recommendation.targetValueUsd),
      hint: "Midpoint of opening and reservation",
    },
    {
      label: "Reservation value",
      value: formatUsdM(recommendation.reservationValueUsd),
      hint: "Value ceiling — base-case value (present terms); do not pay more than this",
    },
    {
      label: "Walk-away threshold",
      value: formatUsdM(recommendation.walkAwayValueUsd),
      hint: "Same ceiling in nominal cash terms — walk if the ask exceeds it",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where we stand</CardTitle>
        <CardDescription>
          Positions on price, anchored by value: what we open with, what we accept, and where we
          walk away
        </CardDescription>
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
          <ApprovalAwareAiLabel
            label="AI draft"
            modelId="deterministic-engine"
            sources={[`${scenarioCount} scenarios`, `${comparableCount} comparables`]}
            uncertainty="low"
          />
          <span>{recommendation.generatedBy.replace(/_/g, " ")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
