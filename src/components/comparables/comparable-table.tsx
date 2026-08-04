"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ATLAS_ANALYSIS_DATE, ATLAS_COMPARABILITY_TARGET } from "@/lib/fixtures";
import type { ComparableTransaction } from "@/lib/domain/types";
import { computeComparability, type ComparabilityOutput } from "@/lib/valuation/engine";
import {
  comparabilityScore,
  monthsBetween,
  type ComparabilityDimensionKey,
  type ComparabilityResult,
} from "@/lib/valuation/formulas";
import {
  ARCHETYPE_LABELS,
  EXCLUSIVITY_LABELS,
  fmtDate,
  fmtMoney,
  fmtScore,
} from "../valuation/format";
import type { ComparableFilters } from "./filters";

export interface ComparableRow {
  comparable: ComparableTransaction;
  output: ComparabilityOutput;
  result: ComparabilityResult;
}

export function computeComparableRow(comparable: ComparableTransaction): ComparableRow {
  const output = computeComparability(comparable, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
  const result = comparabilityScore(comparable, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
  return { comparable, output, result };
}

export function matchesFilters(row: ComparableRow, filters: ComparableFilters): boolean {
  const { comparable, output } = row;
  if (filters.archetype !== "all" && comparable.archetype !== filters.archetype) {
    return false;
  }
  if (filters.exclusivity !== "all" && comparable.exclusivity !== filters.exclusivity) {
    return false;
  }
  if (
    filters.minSourceQuality !== "all" &&
    comparable.sourceQuality < Number(filters.minSourceQuality)
  ) {
    return false;
  }
  if (filters.provenance === "synthetic" && !comparable.synthetic) {
    return false;
  }
  if (filters.provenance === "public" && comparable.synthetic) {
    return false;
  }
  if (filters.minComparability !== "all" && output.adjustedScore < Number(filters.minComparability)) {
    return false;
  }
  switch (filters.term) {
    case "le24":
      if (comparable.termMonths == null || comparable.termMonths > 24) return false;
      break;
    case "25to36":
      if (comparable.termMonths == null || comparable.termMonths <= 24 || comparable.termMonths > 36) {
        return false;
      }
      break;
    case "gt36":
      if (comparable.termMonths == null || comparable.termMonths <= 36) return false;
      break;
    case "na":
      if (comparable.termMonths != null) return false;
      break;
    default:
      break;
  }
  return true;
}

const DIM_LABELS: Record<ComparabilityDimensionKey, string> = {
  archetype: "Archetype",
  rightsExclusivity: "Rights & exclusivity",
  economicStructure: "Economic structure",
  termRenewal: "Term & renewal",
  distributionUsage: "Distribution & usage",
  integrationBurden: "Integration burden",
  sourceQuality: "Source quality",
};

function displayedValue(comparable: ComparableTransaction): string {
  if (comparable.disclosedValueUsd != null) {
    return fmtMoney(comparable.disclosedValueUsd);
  }
  const sum = (comparable.cashComponentUsd ?? 0) + (comparable.inKindValueUsd ?? 0);
  return sum > 0 ? fmtMoney(sum) : "n/d";
}

function inclusionRationale(comparable: ComparableTransaction, result: ComparabilityResult): string[] {
  const points: string[] = [];
  for (const dimension of result.dimensions) {
    if (dimension.score >= 0.7) {
      points.push(`${DIM_LABELS[dimension.key]}: ${fmtScore(dimension.score)}`);
    }
  }
  if (comparable.minimumUsage != null) {
    points.push(`Usage commitment $${comparable.minimumUsage.toFixed(1)}M/yr`);
  }
  if (comparable.distributionCommitment) {
    points.push("Distribution channel component");
  }
  points.push(`Source quality ${comparable.sourceQuality}/5`);
  return points;
}

function NormalizationPanel({ row }: { row: ComparableRow }) {
  const { normalizationFactors } = row.comparable;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">Normalization factors</h4>
      {normalizationFactors.length === 0 ? (
        <p className="text-xs text-muted-foreground">None recorded.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {normalizationFactors.map((factor) => (
            <div key={factor.label} className="flex items-start justify-between gap-2 py-1.5 text-xs">
              <div className="min-w-0">
                <div className="font-medium">{factor.label}</div>
                {factor.note ? (
                  <div className="text-muted-foreground">{factor.note}</div>
                ) : null}
              </div>
              <Badge variant={factor.direction === "up" ? "outline" : "secondary"}>
                ×{factor.factor.toFixed(2)} {factor.direction}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RationalePanel({ row }: { row: ComparableRow }) {
  const { comparable, result } = row;
  const rationale = inclusionRationale(comparable, result);
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">Rationale & source</h4>
      <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
        {rationale.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-1 text-xs">{comparable.notes}</p>
      <p className="text-[11px] text-muted-foreground">Source: {comparable.sourceLabel}</p>
    </div>
  );
}

function ValueAdjustmentPanel({ row }: { row: ComparableRow }) {
  const { comparable } = row;
  const cells: Array<{ label: string; value: string }> = [
    { label: "Disclosed value", value: comparable.disclosedValueUsd != null ? fmtMoney(comparable.disclosedValueUsd) : "n/d" },
    { label: "Cash component", value: comparable.cashComponentUsd != null ? fmtMoney(comparable.cashComponentUsd) : "n/d" },
    { label: "In-kind value", value: comparable.inKindValueUsd != null ? fmtMoney(comparable.inKindValueUsd) : "n/d" },
    { label: "Min usage / yr", value: comparable.minimumUsage != null ? fmtMoney(comparable.minimumUsage) : "n/d" },
    { label: "Distribution", value: comparable.distributionCommitment ?? "n/d" },
    { label: "Integration burden", value: `${comparable.integrationBurden}/5` },
  ];
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">Value adjustments</h4>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">{cell.label}</span>
            <span className="text-xs font-medium">{cell.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecencyPanel({ row }: { row: ComparableRow }) {
  const { comparable, output, result } = row;
  const months = monthsBetween(comparable.announcementDate, ATLAS_ANALYSIS_DATE);
  const decayed = output.recencyDecayFactor < 1;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium text-muted-foreground uppercase">Recency (G-15)</h4>
      <p className="text-xs">
        Announced {fmtDate(comparable.announcementDate)} · {Math.round(months)} months before
        analysis.
      </p>
      <p className="text-xs tabular-nums">
        Decay factor ×{fmtScore(output.recencyDecayFactor)}
        {decayed ? (
          <Badge variant="destructive" className="ml-2">
            decayed
          </Badge>
        ) : (
          <Badge variant="outline" className="ml-2">
            no decay
          </Badge>
        )}
      </p>
      <div className="mt-2 flex flex-col gap-1">
        {result.dimensions.map((dimension) => (
          <div key={dimension.key} className="flex items-center gap-2 text-xs">
            <span className="w-36 shrink-0 truncate">{DIM_LABELS[dimension.key]}</span>
            <div className="h-1.5 min-w-0 flex-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/70"
                style={{ width: `${Math.round(dimension.score * 100)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right tabular-nums">{fmtScore(dimension.score)}</span>
            <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
              {dimension.weighted.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ComparableTableProps {
  rows: ComparableRow[];
}

export function ComparableTable({ rows }: ComparableTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-sm text-muted-foreground">
        <p>No comparables match the current filters.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-44">Comparable</TableHead>
          <TableHead>Archetype</TableHead>
          <TableHead className="text-right">Term</TableHead>
          <TableHead>Exclusivity</TableHead>
          <TableHead className="text-right">Source</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Adjusted</TableHead>
          <TableHead className="text-right">Decay</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const { comparable, output } = row;
          const isOpen = expanded.has(comparable.id);
          const decayed = output.recencyDecayFactor < 1;
          return (
            <TableRow
              key={comparable.id}
              aria-expanded={isOpen}
              onClick={() => toggle(comparable.id)}
              className="cursor-pointer"
            >
              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comparable.name}</span>
                  {comparable.synthetic ? <Badge variant="secondary">Synthetic</Badge> : null}
                </div>
                <div className="text-xs text-muted-foreground">{comparable.sourceLabel}</div>
              </TableCell>
              <TableCell>{ARCHETYPE_LABELS[comparable.archetype]}</TableCell>
              <TableCell className="text-right tabular-nums">
                {comparable.termMonths != null ? `${comparable.termMonths} mo` : "n/d"}
              </TableCell>
              <TableCell>{EXCLUSIVITY_LABELS[comparable.exclusivity]}</TableCell>
              <TableCell className="text-right tabular-nums">
                {comparable.sourceQuality}/5
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {displayedValue(comparable)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmtScore(output.rawScore)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {fmtScore(output.adjustedScore)}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={decayed ? "destructive" : "outline"}>
                  ×{fmtScore(output.recencyDecayFactor)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={isOpen ? "Collapse row" : "Expand row"}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(comparable.id);
                  }}
                >
                  {isOpen ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.map((row) =>
          expanded.has(row.comparable.id) ? (
            <TableRow key={`${row.comparable.id}-detail`}>
              <TableCell colSpan={10} className="bg-muted/30 p-0 align-top">
                <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
                  <NormalizationPanel row={row} />
                  <RationalePanel row={row} />
                  <ValueAdjustmentPanel row={row} />
                  <RecencyPanel row={row} />
                </div>
              </TableCell>
            </TableRow>
          ) : null,
        )}
      </TableBody>
    </Table>
  );
}
