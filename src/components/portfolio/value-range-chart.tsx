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
          <XAxis dataKey="scenario" tick={{ fontSize: 12 }} stroke="var(--border)" />
          <YAxis
            tick={{ fontSize: 12 }}
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
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-medium">{label}</div>
                  <div>Gross value (GPV) {fmt(datum.grossValueUsd)}</div>
                  <div>Confidence-adjusted (CAV) {fmt(datum.adjustedValueUsd)}</div>
                  <div>Gap vs cost {fmt(datum.gapUsd)}</div>
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            y={costUsd}
            stroke="var(--destructive)"
            strokeDasharray="4 4"
            label={{
              value: "Total economic cost",
              position: "insideTopLeft",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <Bar dataKey="grossValueUsd" name="Gross value (GPV)" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="adjustedValueUsd" name="Confidence-adjusted (CAV)" fill="var(--chart-4)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function fmt(value: number): string {
  const prefix = value < 0 ? "-" : "";
  return `${prefix}$${Math.abs(value).toFixed(1)}M`;
}
