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
import { formatDate, formatUsdM, toCsv, toJson, toMarkdown } from "@/lib/export";
import type { ComparableTransaction } from "@/lib/domain/types";
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
  TableRow,
} from "@/components/ui/table";
import { AILabel } from "@/components/assistant/ai-label";
import { AuditTimeline } from "@/components/audit/audit-timeline";
import { AuditExports } from "@/components/audit/export-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Decision history — Atlas Knowledge Systems",
  description: "See how this recommendation was built — every change, approval, and piece of evidence.",
};

const ARCHETYPE_LABELS: Record<ComparableTransaction["archetype"], string> = {
  data_licensing: "Data Licensing",
  product_integration: "Product Integration",
  distribution: "Distribution",
  strategic_ecosystem: "Strategic Ecosystem",
  hybrid: "Hybrid",
};

export default function AuditPage() {
  const opportunity = ATLAS_OPPORTUNITY;
  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });
  const recommendation = ATLAS_RECOMMENDATION;
  const base = valuation.byName.base;

  const selectedComparables = opportunity.selectedComparableIds
    .map((id) => ATLAS_COMPARABLES.find((comparable) => comparable.id === id))
    .filter((comparable): comparable is ComparableTransaction => comparable != null);

  const briefMarkdown = toMarkdown(opportunity, valuation, recommendation);
  const briefJson = toJson(opportunity);
  const comparablesCsv = toCsv(ATLAS_COMPARABLES);

  const confidenceDims = [
    { key: "Evidence quality", value: base.confidenceFactorDims.evidenceQuality },
    { key: "Assumption stability", value: base.confidenceFactorDims.assumptionStability },
    { key: "Comparable quality", value: base.confidenceFactorDims.comparableQuality },
    { key: "Implementation certainty", value: base.confidenceFactorDims.implementationCertainty },
    { key: "Partner execution confidence", value: base.confidenceFactorDims.partnerExecutionConfidence },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(badgeVariants({ variant: "outline" }))}>Synthetic</span>
          <span className={cn(badgeVariants({ variant: "default" }))}>
            Recommendation · {recommendation.decision}
          </span>
          <AILabel
            label="AI draft"
            generatedAt={ATLAS_ANALYSIS_DATE.slice(0, 10)}
            modelId="deterministic-engine"
            sources={[`${ATLAS_COMPARABLES.length} comparables`, "3 scenarios"]}
            uncertainty="low"
            approvalStatus="awaiting"
          />
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Decision history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunity.name} · trace how this recommendation was built — every change, every
          approval, and the evidence behind the numbers. Owner {opportunity.owner} · created{" "}
          {formatDate(opportunity.createdAt)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <AuditTimeline
            events={opportunity.auditEvents}
            owner={opportunity.owner}
            decision={recommendation.decision}
            opportunityName={opportunity.name}
          />
        </section>

        <section className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Explainability</CardTitle>
              <CardDescription>Seven questions the recommendation must answer</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium">1. Which assumptions drive the result?</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {opportunity.assumptions.map((assumption) => (
                    <li key={assumption.id}>
                      {assumption.label} ({assumption.category}) · confidence {assumption.confidence} ·{" "}
                      {assumption.owner}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium">2. Which comparable transactions were used?</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {selectedComparables.map((comparable) => (
                    <li key={comparable.id}>
                      {comparable.name} · {ARCHETYPE_LABELS[comparable.archetype]} · comparability{" "}
                      {comparable.comparabilityScore.toFixed(2)} · source quality{" "}
                      {comparable.sourceQuality}/5
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium">3. How were they adjusted?</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {selectedComparables.map((comparable) => (
                    <li key={comparable.id}>
                      {comparable.name}:{" "}
                      {comparable.normalizationFactors.length === 0
                        ? "no normalization"
                        : comparable.normalizationFactors
                            .map((factor) => `${factor.label} (${factor.direction} ${factor.factor})`)
                            .join("; ")}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium">4. What is the confidence factor and why?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The base-scenario confidence factor is {base.confidenceFactor.toFixed(2)}, an
                  average of five dimensions:
                </p>
                <Table aria-label="Confidence dimensions" className="mt-2">
                  <TableBody>
                    {confidenceDims.map((dim) => (
                      <TableRow key={dim.key}>
                        <TableCell className="whitespace-normal">{dim.key}</TableCell>
                        <TableCell className="tabular-nums">{dim.value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className="text-sm font-medium">5. Which risk costs were included?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expected risk cost (ERC): downside{" "}
                  {formatUsdM(valuation.byName.downside.expectedRiskCostUsd)} · base{" "}
                  {formatUsdM(base.expectedRiskCostUsd)} · upside{" "}
                  {formatUsdM(valuation.byName.upside.expectedRiskCostUsd)}.
                </p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {opportunity.risks.map((risk) => (
                    <li key={risk.id}>
                      {risk.description} ({risk.category}) · p={risk.probability} · impact{" "}
                      {formatUsdM(risk.impactUsd ?? 0)} · {risk.severity}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium">6. What evidence would change the recommendation?</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {recommendation.changeConditions.map((condition) => (
                    <li key={condition}>{condition}</li>
                  ))}
                  {recommendation.missingEvidence.slice(0, 3).map((item) => (
                    <li key={item}>Missing evidence: {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium">7. Who approved the final view?</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {opportunity.approvals.map((approval) => (
                    <li key={approval.id}>
                      {approval.gate} · {approval.approver} · {formatDate(approval.approvedAt)}
                    </li>
                  ))}
                  <li>Decision approval: awaiting human sign-off (use Approve decision).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="mt-4 rounded-xl border bg-card p-4">
        <AuditExports markdown={briefMarkdown} json={briefJson} csv={comparablesCsv} />
      </div>
    </div>
  );
}
