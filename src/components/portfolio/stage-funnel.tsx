"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatM } from "./format";

export interface StageFunnelDatum {
  stage: string;
  valueUsd: number;
  count: number;
  active: boolean;
}

interface StageFunnelChartProps {
  data: StageFunnelDatum[];
  maxValueUsd: number;
}

const TICK_STYLE = { fontSize: 12, fontWeight: 500, fill: "var(--muted-foreground)" };

export function StageFunnelChart({ data, maxValueUsd }: StageFunnelChartProps) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label={`Confidence-adjusted value by stage: ${data
        .map(
          (d) =>
            `${d.stage} ${formatM(d.valueUsd)} across ${d.count} case${d.count === 1 ? "" : "s"}`,
        )
        .join(", ")}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            domain={[0, Math.max(maxValueUsd, 1)]}
            tick={TICK_STYLE}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
            stroke="var(--border)"
          />
          <YAxis type="category" dataKey="stage" width={92} tick={TICK_STYLE} stroke="var(--border)" />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const datum = payload[0].payload as StageFunnelDatum;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-semibold text-foreground">{label}</div>
                  <div className="font-medium text-foreground">
                    {formatM(datum.valueUsd)} confidence-adjusted value
                  </div>
                  <div className="text-muted-foreground">
                    {datum.count} case{datum.count === 1 ? "" : "s"} at this stage
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="valueUsd" radius={[2, 2, 2, 2]} minPointSize={3}>
            <LabelList
              dataKey="count"
              position="right"
              formatter={(value: unknown) => `${value} case${Number(value) === 1 ? "" : "s"}`}
              style={{ fontSize: 11, fontWeight: 500, fill: "var(--muted-foreground)" }}
            />
            {data.map((datum) => (
              <Cell
                key={datum.stage}
                fill={
                  datum.active
                    ? "var(--chart-3)"
                    : datum.count === 0
                      ? "var(--border)"
                      : "var(--chart-1)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
