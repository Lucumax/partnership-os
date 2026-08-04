"use client";

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ComparableTable,
  computeComparableRow,
  matchesFilters,
} from "@/components/comparables/comparable-table";
import {
  DEFAULT_FILTERS,
  FiltersBar,
  type ComparableFilters,
} from "@/components/comparables/filters";
import { ARCHETYPE_LABELS, EXCLUSIVITY_LABELS } from "@/components/valuation/format";
import { ATLAS_COMPARABLES, ATLAS_COMPARABILITY_TARGET } from "@/lib/fixtures";

export default function ComparablesPage() {
  const [filters, setFilters] = useState<ComparableFilters>(DEFAULT_FILTERS);

  const allRows = useMemo(() => ATLAS_COMPARABLES.map(computeComparableRow), []);
  const visibleRows = useMemo(
    () => allRows.filter((row) => matchesFilters(row, filters)),
    [allRows, filters],
  );

  const updateFilters = (patch: Partial<ComparableFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
  };

  const target = ATLAS_COMPARABILITY_TARGET;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <a
          href="/opportunities/atlas"
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Atlas opportunity
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">Comparable library</h1>
          <Badge variant="outline">Target: Atlas Knowledge Systems</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Deterministic comparability against the Atlas target — {ARCHETYPE_LABELS[target.archetype]} ·
          {EXCLUSIVITY_LABELS[target.exclusivity]} exclusivity · {target.termMonths} months ·
          integration burden {target.integrationBurden}/5. Scores decay with recency after 24 months
          (G-15). {allRows.length} seeded comparables, all synthetic.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            {visibleRows.length} of {allRows.length} comparables shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FiltersBar filters={filters} onChange={updateFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 sm:p-0">
          <ComparableTable rows={visibleRows} />
        </CardContent>
      </Card>
    </div>
  );
}
