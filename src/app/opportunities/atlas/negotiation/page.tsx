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
import { formatDate, toJson, toMarkdown } from "@/lib/export";
import { decisionLabel } from "@/components/portfolio/labels";
import { badgeVariants } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AILabel } from "@/components/assistant/ai-label";
import { NegotiationActions } from "@/components/negotiation/negotiation-actions";
import { PositionPanel } from "@/components/negotiation/position-panel";
import { GiveGetMatrix } from "@/components/negotiation/give-get-matrix";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Negotiation brief — Atlas Knowledge Systems",
  description: "What to offer, what to accept, and where to walk away on Atlas.",
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

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(badgeVariants({ variant: "outline" }))}>Synthetic</span>
          <span className={cn(badgeVariants({ variant: "default" }))}>
            Decision · {decisionLabel(recommendation.decision)}
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
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          What should we offer, what would we accept, and where do we walk away? This brief is
          your anchor for the conversation.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-3">
          <PositionPanel
            recommendation={recommendation}
            scenarioCount={valuation.scenarios.length}
            comparableCount={comparables.length}
          />
        </section>

        <section className="lg:col-span-6">
          <GiveGetMatrix
            rows={giveGetRows}
            base={valuation.byName.base}
            upside={valuation.byName.upside}
          />
        </section>

        <section className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Constraints &amp; evidence</CardTitle>
              <CardDescription>What is non-negotiable, what we do not know, and what to ask</CardDescription>
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
                  What would change the recommendation
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
    </div>
  );
}
