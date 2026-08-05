"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Scenario } from "@/lib/domain/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "./format";

interface WaterfallDatum {
  label: string;
  start: number;
  delta: number;
  kind: "value" | "cost" | "total";
  running: number;
}

interface WaterfallItem {
  label: string;
  value: number;
  kind: "value" | "cost";
}

export function valueWaterfallData(scenario: Scenario): WaterfallDatum[] {
  const items: WaterfallItem[] = [
    { label: "Direct financial", value: scenario.directFinancialValueUsd, kind: "value" },
    { label: "Usage & customer", value: scenario.usageCustomerValueUsd, kind: "value" },
    { label: "Product capability", value: scenario.productCapabilityValueUsd, kind: "value" },
    { label: "Distribution", value: scenario.distributionValueUsd, kind: "value" },
    { label: "Strategic option", value: scenario.strategicOptionValueUsd, kind: "value" },
    { label: "Learning", value: scenario.learningValueUsd, kind: "value" },
    { label: "Brand", value: scenario.brandValueUsd, kind: "value" },
    { label: "Implementation cost", value: -scenario.implementationCostUsd, kind: "cost" },
    {
      label: "Exclusivity cost",
      value: -scenario.exclusivityOpportunityCostUsd,
      kind: "cost",
    },
    { label: "Expected risk cost", value: -scenario.expectedRiskCostUsd, kind: "cost" },
    { label: "Lock-in cost", value: -scenario.concentrationLockInCostUsd, kind: "cost" },
    { label: "Exit cost", value: -scenario.exitCostUsd, kind: "cost" },
  ];

  let running = 0;
  const data: WaterfallDatum[] = items.map((item) => {
    const start = running;
    running += item.value;
    return { label: item.label, start, delta: item.value, kind: item.kind, running };
  });
  data.push({ label: "Gross value", start: 0, delta: running, kind: "total", running });

  return data;
}

function fmtDelta(value: number): string {
  return value >= 0 ? `+${value.toFixed(1)}` : `−${Math.abs(value).toFixed(1)}`;
}

function WaterfallTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: WaterfallDatum }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const datum = payload[0].payload;
  const sign = datum.delta >= 0 ? "+" : "−";
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm">
      <div className="font-medium">{label}</div>
      <div className="tabular-nums">
        {datum.kind === "total"
          ? `Gross value ${fmtMoney(datum.delta)}`
          : `${datum.kind === "cost" ? "Cost" : "Value"} ${sign}$${Math.abs(datum.delta).toFixed(1)}M`}
      </div>
      <div className="text-muted-foreground tabular-nums">Running total {fmtMoney(datum.running)}</div>
    </div>
  );
}

export function ValueWaterfall({ scenario }: { scenario: Scenario }) {
  const data = valueWaterfallData(scenario);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>How the base value is built</CardTitle>
            <CardDescription>
              Value components add, costs subtract, and the final bar is gross partnership value
              (GPV).
            </CardDescription>
          </div>
          <Badge variant="outline">Gross {fmtMoney(scenario.grossPartnershipValueUsd)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="h-72 w-full"
          role="img"
          aria-label={`Base scenario value waterfall: ${data
            .map(
              (d) =>
                `${d.label} ${d.kind === "cost" ? "-" : "+"}$${Math.abs(d.delta).toFixed(1)}M, running $${d.running.toFixed(1)}M`,
            )
            .join(", ")}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-30}
                height={58}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(value: number) => `$${value}M`}
                tick={{ fontSize: 11 }}
                width={44}
              />
              <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="start" stackId="waterfall" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="delta" stackId="waterfall" isAnimationActive={false} radius={[1, 1, 1, 1]}>
                <LabelList
                  dataKey="delta"
                  position="top"
                  formatter={(value: unknown) => fmtDelta(Number(value))}
                  style={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                />
                {data.map((datum, index) => (
                  <Cell
                    key={index}
                    fill={
                      datum.kind === "value"
                        ? "var(--chart-4)"
                        : datum.kind === "cost"
                          ? "var(--destructive)"
                          : "var(--chart-5)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-[var(--chart-4)]" /> Value component
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-[var(--destructive)]" /> Cost
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-[var(--chart-5)]" /> Gross value
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
