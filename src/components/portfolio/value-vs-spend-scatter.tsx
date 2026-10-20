"use client";

import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatM } from "./format";

export interface ValueVsSpendDatum {
  name: string;
  spendUsd: number;
  valueUsd: number;
  gapUsd: number;
  active?: boolean;
}

interface ValueVsSpendScatterProps {
  data: ValueVsSpendDatum[];
  maxUsd: number;
}

const TICK_STYLE = { fontSize: 12, fontWeight: 500, fill: "var(--muted-foreground)" };

export function ValueVsSpendScatter({ data, maxUsd }: ValueVsSpendScatterProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-64 w-full"
        role="img"
        aria-label={`Value versus spend for ${data.length} cases: ${data
          .map(
            (d) =>
              `${d.name} spend $${d.spendUsd.toFixed(1)}M, value $${d.valueUsd.toFixed(1)}M, gap $${d.gapUsd.toFixed(1)}M`,
          )
          .join("; ")}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="spendUsd"
              name="Proposed spend"
              domain={[0, maxUsd]}
              tick={TICK_STYLE}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
              stroke="var(--border)"
            />
            <YAxis
              type="number"
              dataKey="valueUsd"
              name="Confidence-adjusted value"
              domain={[0, maxUsd]}
              tick={TICK_STYLE}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
              stroke="var(--border)"
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }
                const datum = payload[0].payload as ValueVsSpendDatum;
                const pays = datum.gapUsd >= 0;
                return (
                  <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                    <div className="font-semibold text-foreground">{datum.name}</div>
                    <div className={`font-medium ${pays ? "text-foreground" : "text-destructive"}`}>
                      {pays
                        ? `Pays for itself by ${formatM(datum.gapUsd)}`
                        : `Falls short by ${formatM(Math.abs(datum.gapUsd))}`}
                    </div>
                    <div className="text-muted-foreground">
                      CAV {formatM(datum.valueUsd)} vs spend {formatM(datum.spendUsd)}
                    </div>
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
            <Scatter data={data} fill="var(--chart-1)">
              {data.map((datum) => (
                <Cell key={datum.name} fill={datum.active ? "var(--chart-3)" : "var(--chart-1)"} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-[var(--chart-3)]" /> Atlas (modeled
          case)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-[var(--chart-1)]" /> Portfolio-only
          cases
        </span>
      </div>
    </div>
  );
}
