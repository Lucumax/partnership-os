import type { ScenarioName } from "@/lib/domain/types";
import type { ValuationResult } from "@/lib/valuation/engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney, fmtPayback, fmtPct, fmtSignedMoney } from "./format";

const SCENARIO_META: Record<ScenarioName, { label: string; hint: string }> = {
  downside: { label: "Downside", hint: "45% adoption · 12 mo integration · 35% renewal" },
  base: { label: "Base", hint: "75% adoption · 7 mo integration · 60% renewal" },
  upside: { label: "Upside", hint: "110% adoption · 4 mo integration · 80% renewal" },
};

const ORDER: ScenarioName[] = ["downside", "base", "upside"];

export function ScenarioCards({ valuation }: { valuation: ValuationResult }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {ORDER.map((name) => {
        const scenario = valuation.byName[name];
        const meta = SCENARIO_META[name];
        const gap = valuation.gapUsd[name];
        const highlighted = name === "base";
        return (
          <Card key={name} className={highlighted ? "ring-2 ring-ring/70" : undefined}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{meta.label}</span>
                <Badge
                  variant={
                    name === "downside"
                      ? "destructive"
                      : name === "upside"
                        ? "default"
                        : "secondary"
                  }
                >
                  CF {fmtPct(scenario.confidenceFactor)}
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-semibold tracking-tight tabular-nums">
                  {fmtMoney(scenario.confidenceAdjustedValueUsd)}
                </div>
                <div className="text-xs text-muted-foreground">Confidence-adjusted value</div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Gross value</span>
                  <span className="tabular-nums">{fmtMoney(scenario.grossPartnershipValueUsd)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">ROI</span>
                  <span className="tabular-nums">{fmtPct(scenario.roi)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Payback</span>
                  <span className="tabular-nums">{fmtPayback(scenario.paybackMonths)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Gap vs proposed</span>
                  <span className={gap >= 0 ? "tabular-nums" : "text-destructive tabular-nums"}>
                    {fmtSignedMoney(gap)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] leading-4 text-muted-foreground">{meta.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
