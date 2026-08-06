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

import { formatM } from "./format";

export interface ConcentrationDatum {
  archetype: string;
  valueUsd: number;
  share: number;
}

interface ConcentrationByArchetypeProps {
  data: ConcentrationDatum[];
  maxValueUsd: number;
}

const TICK_STYLE = { fontSize: 12, fontWeight: 500, fill: "var(--muted-foreground)" };

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
            tick={TICK_STYLE}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
            stroke="var(--border)"
          />
          <YAxis type="category" dataKey="archetype" width={114} tick={TICK_STYLE} stroke="var(--border)" />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const datum = payload[0].payload as ConcentrationDatum;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-semibold text-foreground">{label}</div>
                  <div className="font-medium text-foreground">
                    {datum.share.toFixed(0)}% of portfolio CAV
                  </div>
                  <div className="text-muted-foreground">{formatM(datum.valueUsd)}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="valueUsd" radius={[2, 2, 2, 2]}>
            {data.map((datum) => (
              <Cell key={datum.archetype} fill="var(--chart-1)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
