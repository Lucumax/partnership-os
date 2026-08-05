import { Gauge } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "./format";
import type { Sensitivity } from "./sensitivities";

export function SensitivityList({ sensitivities }: { sensitivities: Sensitivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Gauge className="size-3.5" /> Top sensitivities
        </CardTitle>
        <CardDescription>A ±10% swing on these assumptions moves the value most — focus due diligence here.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {sensitivities.map((item, index) => (
          <div key={item.variable} className="flex items-start justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="leading-tight font-medium">{item.variable}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  base {fmtMoney(item.baseValue)} · CAV −10% {fmtMoney(item.cavMinus10Usd)} · +10%{" "}
                  {fmtMoney(item.cavPlus10Usd)}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-xs font-medium tabular-nums">
              {fmtMoney(item.deltaAbsUsd)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
