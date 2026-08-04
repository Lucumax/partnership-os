"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ValueVsSpendDatum {
  name: string;
  spendUsd: number;
  valueUsd: number;
  gapUsd: number;
}

interface ValueVsSpendScatterProps {
  data: ValueVsSpendDatum[];
  maxUsd: number;
}

export function ValueVsSpendScatter({ data, maxUsd }: ValueVsSpendScatterProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="spendUsd"
            name="Proposed spend"
            domain={[0, maxUsd]}
            tick={{ fontSize: 12 }}
            stroke="var(--border)"
          />
          <YAxis
            type="number"
            dataKey="valueUsd"
            name="Confidence-adjusted value"
            domain={[0, maxUsd]}
            tick={{ fontSize: 12 }}
            stroke="var(--border)"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const datum = payload[0].payload as ValueVsSpendDatum;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-medium">{datum.name}</div>
                  <div>Spend {fmt(datum.spendUsd)}</div>
                  <div>Value {fmt(datum.valueUsd)}</div>
                  <div>Gap {fmt(datum.gapUsd)}</div>
                </div>
              );
            }}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: maxUsd, y: maxUsd },
            ]}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
          />
          <Scatter data={data} fill="var(--chart-4)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function fmt(value: number): string {
  const prefix = value < 0 ? "-" : "";
  return `${prefix}$${Math.abs(value).toFixed(1)}M`;
}
