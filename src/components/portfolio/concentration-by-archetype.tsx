"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ConcentrationDatum {
  archetype: string;
  valueUsd: number;
  share: number;
}

interface ConcentrationByArchetypeProps {
  data: ConcentrationDatum[];
  maxValueUsd: number;
}

export function ConcentrationByArchetypeChart({ data, maxValueUsd }: ConcentrationByArchetypeProps) {
  return (
    <div
      className="h-40 w-full"
      role="img"
      aria-label={`Confidence-adjusted value by archetype: ${data
        .map((d) => `${d.archetype} $${d.valueUsd.toFixed(1)}M, ${d.share.toFixed(0)}%`)
        .join(", ")}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            domain={[0, Math.max(maxValueUsd, 1)]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
            stroke="var(--border)"
          />
          <YAxis
            type="category"
            dataKey="archetype"
            width={110}
            tick={{ fontSize: 12 }}
            stroke="var(--border)"
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const datum = payload[0].payload as ConcentrationDatum;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-medium">{label}</div>
                  <div>{fmt(datum.valueUsd)} · {datum.share.toFixed(0)}% of portfolio value</div>
                </div>
              );
            }}
          />
          <Bar dataKey="valueUsd" radius={[2, 2, 2, 2]}>
            {data.map((datum) => (
              <Cell key={datum.archetype} fill="var(--chart-4)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function fmt(value: number): string {
  return `$${Math.abs(value).toFixed(1)}M`;
}
