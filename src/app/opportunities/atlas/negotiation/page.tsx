import type { Metadata } from "next";

import {
  ATLAS_ANALYSIS_DATE,
  ATLAS_COMPARABLES,
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_RECOMMENDATION,
  ATLAS_SCENARIO_INPUTS,
} from "@/lib/fixtures";
import { computeValuation } from "@/lib/valuation/engine";
import { deriveGiveGetRows, derivePartnerQuestions, deriveRedLines } from "@/lib/negotiation/derive";
import { formatDate, formatUsdM, formatUsdMDelta, toJson, toMarkdown } from "@/lib/export";
import { badgeVariants } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AILabel } from "@/components/assistant/ai-label";
import { NegotiationActions } from "@/components/negotiation/negotiation-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Negotiation brief — Atlas Knowledge Systems",
  description: "Negotiation position, give/get matrix, and constraints for Atlas.",
};

export default function NegotiationPage() {
  const opportunity = ATLAS_OPPORTUNITY;
  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });
  const recommendation = ATLAS_RECOMMENDATION;
  const comparables = ATLAS_COMPARABLES;

  const giveGetRows = deriveGiveGetRows(
    recommendation.giveGetOptions,
    valuation.byName.base,
    valuation.byName.upside,
  );
  const redLines = deriveRedLines(opportunity, recommendation);
  const partnerQuestions = derivePartnerQuestions(opportunity.proposal);
  const briefMarkdown = toMarkdown(opportunity, valuation, recommendation);
  const briefJson = toJson(opportunity);

  const position = [
    { label: "Opening position", value: formatUsdM(recommendation.openingPositionUsd), hint: "Downside CAV" },
    { label: "Target", value: formatUsdM(recommendation.targetValueUsd), hint: "Midpoint base–upside" },
    { label: "Reservation value", value: formatUsdM(recommendation.reservationValueUsd), hint: "Base CAV" },
    { label: "Walk-away point", value: formatUsdM(recommendation.walkAwayValueUsd), hint: "Upside CAV" },
  ];

  return (
    <main className="mx-auto max-w-7xl p-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(badgeVariants({ variant: "outline" }))}>Synthetic</span>
          <span className={cn(badgeVariants({ variant: "default" }))}>
            Decision · {recommendation.decision}
          </span>
          <AILabel
            label="AI draft"
            generatedAt={ATLAS_ANALYSIS_DATE.slice(0, 10)}
            modelId="deterministic-engine"
            sources={["3 scenarios", `${comparables.length} comparables`]}
            uncertainty="low"
            approvalStatus={recommendation.approvedBy ? "approved" : "awaiting"}
          />
          <span
            className={cn(
              badgeVariants({ variant: "outline" }),
              "border-primary/30 text-primary",
            )}
          >
            {recommendation.approvedBy ? "Approved" : "Awaiting approval"}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Negotiation brief</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.name} · {opportunity.archetype.replace(/_/g, " ")} · stage{" "}
          {opportunity.stage} · owner {opportunity.owner}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Position</CardTitle>
              <CardDescription>Derived from the deterministic valuation engine</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="flex flex-col gap-3">
                {position.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs text-muted-foreground">{row.label}</dt>
                    <dd className="text-xl font-semibold tabular-nums">{row.value}</dd>
                    {row.hint ? (
                      <dd className="text-xs text-muted-foreground">{row.hint}</dd>
                    ) : null}
                  </div>
                ))}
              </dl>
              <div>
                <p className="text-xs text-muted-foreground">Preferred structure</p>
                <p className="mt-1 text-sm">{recommendation.preferredStructure}</p>
              </div>
              <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                <AILabel
                  label="AI draft"
                  modelId="deterministic-engine"
                  sources={[
                    `${valuation.scenarios.length} scenarios`,
                    `${comparables.length} comparables`,
                  ]}
                  uncertainty="low"
                  approvalStatus={recommendation.approvedBy ? "approved" : "awaiting"}
                />
                <span>{recommendation.generatedBy.replace(/_/g, " ")}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Give / get matrix</CardTitle>
              <CardDescription>
                Seeded trade options with derived economic, strategic, and risk effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>We give</TableHead>
                    <TableHead>We get</TableHead>
                    <TableHead>Economic impact</TableHead>
                    <TableHead>Strategic impact</TableHead>
                    <TableHead>Risk effect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giveGetRows.map((row, index) => (
                    <TableRow key={`${row.give}-${index}`}>
                      <TableCell>{row.give}</TableCell>
                      <TableCell>{row.get}</TableCell>
                      <TableCell className="tabular-nums whitespace-normal">
                        {formatUsdMDelta(row.economicImpactUsd)}
                      </TableCell>
                      <TableCell className="whitespace-normal">{row.strategicImpact}</TableCell>
                      <TableCell className="whitespace-normal">{row.riskEffect}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                Economic impact is a deterministic share of the upside headroom (
                {formatUsdM(valuation.byName.upside.confidenceAdjustedValueUsd)} vs{" "}
                {formatUsdM(valuation.byName.base.confidenceAdjustedValueUsd)}).
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Constraints &amp; evidence</CardTitle>
              <CardDescription>Red lines, gaps, and partner questions</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Red lines
                </p>
                <ul className="flex flex-col gap-2">
                  {redLines.map((line) => (
                    <li key={line} className="text-sm">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Missing evidence
                </p>
                <ul className="flex flex-col gap-2">
                  {recommendation.missingEvidence.map((item) => (
                    <li key={item} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Partner questions
                </p>
                <ul className="flex flex-col gap-2">
                  {partnerQuestions.map((question) => (
                    <li key={question} className="text-sm">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Conditions that change the recommendation
                </p>
                <ul className="flex flex-col gap-2">
                  {recommendation.changeConditions.map((condition) => (
                    <li key={condition} className="text-sm">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="mt-4 rounded-xl border bg-card p-4">
        <NegotiationActions
          markdown={briefMarkdown}
          json={briefJson}
          initialApprovedBy={recommendation.approvedBy}
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Last updated {formatDate(opportunity.createdAt)} · exports contain only the current
        synthetic case · no live AI at runtime
      </p>
    </main>
  );
}
