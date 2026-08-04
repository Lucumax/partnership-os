"use client";

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AssumptionTable } from "@/components/valuation/assumption-table";
import {
  buildAssumptionRows,
  scenarioInputsFromRows,
  type AssumptionRow,
} from "@/components/valuation/assumption-model";
import { ConfidenceBreakdown } from "@/components/valuation/confidence-breakdown";
import { fmtMoney, fmtMoneyPrecise, fmtPct, fmtSignedMoney } from "@/components/valuation/format";
import { RedTeamList } from "@/components/valuation/red-team-list";
import { ScenarioCards } from "@/components/valuation/scenario-cards";
import { SensitivityList } from "@/components/valuation/sensitivity-list";
import { computeSensitivities } from "@/components/valuation/sensitivities";
import { ValueWaterfall } from "@/components/valuation/value-waterfall";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_RISKS,
  ATLAS_SCENARIO_INPUTS,
} from "@/lib/fixtures";
import { computeValuation } from "@/lib/valuation/engine";

export default function ValuationPage() {
  const [rows, setRows] = useState<AssumptionRow[]>(() => buildAssumptionRows(ATLAS_SCENARIO_INPUTS));

  const scenarioInputs = useMemo(
    () => scenarioInputsFromRows(rows, ATLAS_SCENARIO_INPUTS),
    [rows],
  );

  const valuation = useMemo(
    () => computeValuation({ proposal: ATLAS_PROPOSAL, scenarios: scenarioInputs }),
    [scenarioInputs],
  );

  const sensitivities = useMemo(
    () => computeSensitivities(scenarioInputs, ATLAS_PROPOSAL),
    [scenarioInputs],
  );

  const updateRow = (id: string, patch: Partial<AssumptionRow>) => {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const opportunity = ATLAS_OPPORTUNITY;
  const base = valuation.byName.base;

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
          <h1 className="text-lg font-semibold tracking-tight">{opportunity.name}</h1>
          <Badge variant="secondary">Synthetic</Badge>
          <Badge variant="outline">Valuation workbench</Badge>
          <Badge variant="outline">Hybrid</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Confidence-adjusted value recomputed live from the editable assumptions below. Base case:{" "}
          gross {fmtMoney(base.grossPartnershipValueUsd)} · CAV {fmtMoney(base.confidenceAdjustedValueUsd)} ·
          gap {fmtSignedMoney(valuation.gapUsd.base)}. NPV of cash cost {fmtMoneyPrecise(valuation.npvCashCostUsd)} at{" "}
          {fmtPct(valuation.discountRate)} vs {fmtMoney(valuation.nominalCashCostUsd)} nominal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ScenarioCards valuation={valuation} />
          <ValueWaterfall scenario={base} />
          <Card>
            <CardHeader>
              <CardTitle>Assumptions</CardTitle>
              <CardDescription>
                Edit downside / base / upside values to recompute the engine live.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssumptionTable rows={rows} onChange={updateRow} />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SensitivityList sensitivities={sensitivities} />
          <RedTeamList risks={ATLAS_RISKS} />
          <ConfidenceBreakdown valuation={valuation} />
        </div>
      </div>

      <footer className="evidence-strip">
        <strong>Sources &amp; basis:</strong> all figures are deterministic outputs of the seeded
        synthetic Atlas case (source type: synthetic). Confidence factor is the equal-weight mean of
        five dimensions; NPV applies a {fmtPct(valuation.discountRate)} discount rate to the contract
        cash schedule only (G-2). Sensitivities are ±10% on the top assumptions. No live AI — engine
        is fixture-backed.
      </footer>
    </div>
  );
}
