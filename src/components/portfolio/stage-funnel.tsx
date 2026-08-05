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

export interface StageFunnelDatum {
  stage: string;
  count: number;
  active: boolean;
}

interface StageFunnelChartProps {
  data: StageFunnelDatum[];
  maxCount: number;
}

export function StageFunnelChart({ data, maxCount }: StageFunnelChartProps) {
  return (
    <div
      className="h-56 w-full"
      role="img"
      aria-label={`Pipeline by stage: ${data
        .filter((d) => d.count > 0)
        .map((d) => `${d.stage} ${d.count}`)
        .join(", ")}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
          <XAxis
            type="number"
            domain={[0, Math.max(maxCount, 1)]}
            tickCount={maxCount > 1 ? maxCount + 1 : 2}
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            stroke="var(--border)"
          />
          <YAxis
            type="category"
            dataKey="stage"
            width={88}
            tick={{ fontSize: 12 }}
            stroke="var(--border)"
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const datum = payload[0].payload as StageFunnelDatum;
              return (
                <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                  <div className="font-medium">{label}</div>
                  <div className="text-muted-foreground">
                    {datum.count} opportunity{datum.count === 1 ? "" : "s"}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[2, 2, 2, 2]}>
            {data.map((datum) => (
              <Cell key={datum.stage} fill={datum.active ? "var(--chart-4)" : "var(--chart-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
