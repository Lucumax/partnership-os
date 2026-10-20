"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ATLAS_PROPOSAL, ATLAS_SCENARIO_INPUTS } from "@/lib/fixtures";
import type { ProposalTerms, ScenarioName } from "@/lib/domain/types";
import { computeValuation, type ValuationResult } from "@/lib/valuation/engine";
import { fmtMoney, fmtMoneyPrecise, fmtSignedMoney } from "./format";

const SEEDED_VALUATION: ValuationResult = computeValuation({
  proposal: ATLAS_PROPOSAL,
  scenarios: ATLAS_SCENARIO_INPUTS,
});

const SCENARIO_ORDER: ScenarioName[] = ["downside", "base", "upside"];
const SCENARIO_LABELS: Record<ScenarioName, string> = {
  downside: "Downside",
  base: "Base",
  upside: "Upside",
};

function isProposalEdited(draft: ProposalTerms): boolean {
  return JSON.stringify(draft) !== JSON.stringify(ATLAS_PROPOSAL);
}

interface DraftValuationComparisonProps {
  draft: ProposalTerms;
}

/**
 * Feeds the in-progress draft through the same computeValuation engine used by the
 * valuation screen, and shows it next to the seeded case. This proves the engine
 * genuinely reacts to edited terms — it does NOT write the draft back into
 * ATLAS_PROPOSAL, so the seeded case other screens read from is untouched.
 */
export function DraftValuationComparison({ draft }: DraftValuationComparisonProps) {
  const edited = isProposalEdited(draft);

  const draftValuation = useMemo(
    () => computeValuation({ proposal: draft, scenarios: ATLAS_SCENARIO_INPUTS }),
    [draft],
  );

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm">Draft vs. seeded case, run through the same engine</CardTitle>
          <Badge variant={edited ? "secondary" : "outline"}>
            {edited ? "Edited" : "Unchanged"}
          </Badge>
        </div>
        <CardDescription>
          These numbers call the identical <code>computeValuation</code> engine used on the
          valuation screen, with your draft terms swapped in. Gross value (GPV) and
          confidence-adjusted value (CAV) come from the scenario assumptions set on the
          valuation screen, so they move only if your edits change the cash consideration
          those scenarios are measured against. Nominal and NPV cash cost respond directly to
          what you type here. Nothing on this card is written back to the seeded case — the
          other Atlas screens keep reading the original numbers.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-md border border-border p-3">
            <span className="text-xs text-muted-foreground">Nominal cash cost</span>
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-sm text-muted-foreground line-through">
                {fmtMoney(SEEDED_VALUATION.nominalCashCostUsd)}
              </span>
              <span className="text-base font-semibold">
                {fmtMoney(draftValuation.nominalCashCostUsd)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-border p-3">
            <span className="text-xs text-muted-foreground">
              NPV cash cost at {(draftValuation.discountRate * 100).toFixed(0)}%
            </span>
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-sm text-muted-foreground line-through">
                {fmtMoneyPrecise(SEEDED_VALUATION.npvCashCostUsd)}
              </span>
              <span className="text-base font-semibold">
                {fmtMoneyPrecise(draftValuation.npvCashCostUsd)}
              </span>
            </div>
          </div>
        </div>

        <Table>
          <TableCaption className="sr-only">Draft vs. seeded case valuation by scenario</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario</TableHead>
              <TableHead>GPV (seeded)</TableHead>
              <TableHead>GPV (draft)</TableHead>
              <TableHead>CAV (seeded)</TableHead>
              <TableHead>CAV (draft)</TableHead>
              <TableHead>Gap vs cost (seeded)</TableHead>
              <TableHead>Gap vs cost (draft)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SCENARIO_ORDER.map((name) => {
              const seeded = SEEDED_VALUATION.byName[name];
              const draftScenario = draftValuation.byName[name];
              const seededGap = SEEDED_VALUATION.gapUsd[name];
              const draftGap = draftValuation.gapUsd[name];
              return (
                <TableRow key={name}>
                  <TableCell className="font-medium">{SCENARIO_LABELS[name]}</TableCell>
                  <TableCell className="tabular-nums">
                    {fmtMoney(seeded.grossPartnershipValueUsd)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {fmtMoney(draftScenario.grossPartnershipValueUsd)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {fmtMoney(seeded.confidenceAdjustedValueUsd)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {fmtMoney(draftScenario.confidenceAdjustedValueUsd)}
                  </TableCell>
                  <TableCell className={seededGap >= 0 ? "tabular-nums" : "text-destructive tabular-nums"}>
                    {fmtSignedMoney(seededGap)}
                  </TableCell>
                  <TableCell className={draftGap >= 0 ? "tabular-nums" : "text-destructive tabular-nums"}>
                    {fmtSignedMoney(draftGap)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
