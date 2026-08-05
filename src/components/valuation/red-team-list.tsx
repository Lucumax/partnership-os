import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskItem } from "@/lib/domain/types";
import { fmtMoney, RISK_CATEGORY_LABELS, SEVERITY_LABELS } from "./format";

export function RedTeamList({ risks }: { risks: RiskItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ShieldAlert className="size-3.5" /> Red-team flags
        </CardTitle>
        <CardDescription>Risks a skeptic would raise against the deal, priced into the value.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {risks.map((risk) => {
          const expectedCost = risk.probability * (risk.impactUsd ?? 0);
          const highSeverity = risk.severity === "critical" || risk.severity === "high";
          return (
            <div key={risk.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{risk.description}</span>
                <Badge variant={highSeverity ? "destructive" : "secondary"}>
                  {SEVERITY_LABELS[risk.severity]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {RISK_CATEGORY_LABELS[risk.category]} · P {Math.round(risk.probability * 100)}% ×{" "}
                {fmtMoney(risk.impactUsd ?? 0)} ≈ {fmtMoney(expectedCost)}
                {risk.regulatoryFlag ? " · regulatory flag" : ""}
              </div>
              {risk.mitigation ? (
                <p className="text-xs text-muted-foreground">Mitigation: {risk.mitigation}</p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
