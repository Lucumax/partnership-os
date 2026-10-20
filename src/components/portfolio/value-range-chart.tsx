"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatM, formatPercent } from "./format";

export interface ValueRangeDatum {
  scenario: string;
  grossValueUsd: number;
  adjustedValueUsd: number;
  gapUsd: number;
}

interface ValueRangeChartProps {
  data: ValueRangeDatum[];
  costUsd: number;
  maxUsd: number;
}

const TICK_STYLE = { fontSize: 12, fontWeight: 500, fill: "var(--muted-foreground)" };

export function ValueRangeChart({ data, costUsd, maxUsd }: ValueRangeChartProps) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label={`Gross and confidence-adjusted value by scenario against $${costUsd.toFixed(1)}M cost: ${data
        .map(
          (d) =>
            `${d.scenario} gross $${d.grossValueUsd.toFixed(1)}M, adjusted $${d.adjustedValueUsd.toFixed(1)}M, gap $${d.gapUsd.toFixed(1)}M`,
        )
        .join("; ")}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="scenario" tick={TICK_STYLE} stroke="var(--border)" />
          <YAxis
            tick={TICK_STYLE}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
            domain={[0, maxUsd]}
            stroke="var(--border)"
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const datum = payload[0].payload as ValueRangeDatum;
              const discountUsd = datum.grossValueUsd - datum.adjustedValueUsd;
              const discountPct =
                datum.grossValueUsd > 0 ? discountUsd / datum.grossValueUsd : 0;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-semibold text-foreground">{label}</div>
                  <div className="font-medium text-foreground">
                    Risk discount removes {formatM(discountUsd)} ({formatPercent(discountPct)})
                    versus gross
                  </div>
                  <div className="text-muted-foreground">
                    Gross {formatM(datum.grossValueUsd)} · Adjusted {formatM(datum.adjustedValueUsd)} ·
                    Gap vs cost {formatM(datum.gapUsd, { sign: true })}
                  </div>
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
          <ReferenceLine
            y={costUsd}
            stroke="var(--destructive)"
            strokeDasharray="4 4"
            label={{
              value: "Total economic cost",
              position: "insideTopLeft",
              fill: "var(--muted-foreground)",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <Bar dataKey="grossValueUsd" name="Gross value (GPV)" fill="var(--chart-5)" radius={[2, 2, 0, 0]} />
          <Bar
            dataKey="adjustedValueUsd"
            name="Confidence-adjusted (CAV)"
            fill="var(--chart-1)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
