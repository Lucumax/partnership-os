import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
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
import { OpportunityTabs } from "@/components/portfolio/opportunity-tabs";
import { ValueRangeChart, type ValueRangeDatum } from "@/components/portfolio/value-range-chart";
import {
  formatAssumptionValue,
  formatDate,
  formatM,
  formatPercent,
  formatProbability,
} from "@/components/portfolio/format";
import {
  archetypeLabel,
  decisionLabel,
  EXCLUSIVITY_LABELS,
  riskCategoryLabel,
  scenarioLabel,
  SEVERITY_LABELS,
  stageLabel,
} from "@/components/portfolio/labels";
import {
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_SCENARIO_INPUTS,
} from "@/lib/fixtures";
import type { Assumption, AssumptionCategory, AssumptionValue } from "@/lib/domain/types";
import { computeValuation } from "@/lib/valuation/engine";

export const metadata: Metadata = {
  title: "Atlas Knowledge Systems — Opportunity Overview — Partnership OS",
  description: "Decide whether to sign the Atlas partnership — economics, recommendation, and what still needs evidence.",
};

interface SensitivityRow {
  assumption: Assumption;
  numeric: boolean;
  spread: number;
}

const ASSUMPTION_CATEGORY_LABELS: Record<AssumptionCategory, string> = {
  usage: "Usage",
  revenue: "Revenue",
  cost: "Cost",
  timing: "Timing",
  risk: "Risk",
  renewal: "Renewal",
  strategic: "Strategic",
  other: "Other",
};

function roundUpToTens(value: number): number {
  return Math.ceil(value / 10) * 10;
}

export default function OpportunityOverviewPage() {
  const opportunity = ATLAS_OPPORTUNITY;
  const recommendation = opportunity.recommendation;

  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });
  const base = valuation.byName.base;
  const totalEconomicCostUsd = valuation.totalEconomicCostUsd;

  const valueRangeData: ValueRangeDatum[] = valuation.scenarios.map((scenario) => ({
    scenario: scenarioLabel(scenario.name),
    grossValueUsd: scenario.grossPartnershipValueUsd,
    adjustedValueUsd: scenario.confidenceAdjustedValueUsd,
    gapUsd: valuation.gapUsd[scenario.name],
  }));
  const valueRangeMaxUsd = roundUpToTens(
    Math.max(...valuation.scenarios.map((scenario) => scenario.grossPartnershipValueUsd)),
  );

  const sensitivities: SensitivityRow[] = opportunity.assumptions
    .filter((assumption) => assumption.scenarioValues)
    .map((assumption) => {
      const scenarioValues = assumption.scenarioValues as Record<
        "downside" | "base" | "upside",
        AssumptionValue
      >;
      if (
        typeof scenarioValues.downside === "number" &&
        typeof scenarioValues.base === "number" &&
        typeof scenarioValues.upside === "number"
      ) {
        const denominator = Math.abs(scenarioValues.base) || 1;
        return {
          assumption,
          numeric: true,
          spread: (scenarioValues.upside - scenarioValues.downside) / denominator,
        };
      }
      return { assumption, numeric: false, spread: 0 };
    })
    .sort((a, b) => {
      if (a.numeric !== b.numeric) {
        return a.numeric ? -1 : 1;
      }
      return b.spread - a.spread;
    })
    .slice(0, 5);

  const confidenceDims = [
    { label: "Evidence quality", value: base.confidenceFactorDims.evidenceQuality },
    { label: "Assumption stability", value: base.confidenceFactorDims.assumptionStability },
    { label: "Comparable quality", value: base.confidenceFactorDims.comparableQuality },
    { label: "Implementation certainty", value: base.confidenceFactorDims.implementationCertainty },
    { label: "Partner execution", value: base.confidenceFactorDims.partnerExecutionConfidence },
  ];

  const highRisks = opportunity.risks.filter(
    (risk) => risk.severity === "high" || risk.severity === "critical",
  );

  const proposedEconomics = [
    { label: "Contract term", value: `${opportunity.proposal.termMonths} months` },
    { label: "Upfront payment", value: formatM(opportunity.proposal.upfrontCashUsd) },
    {
      label: "Annual license fee",
      value: `${formatM(opportunity.proposal.annualLicenseFeeUsd)} / year`,
    },
    {
      label: "Minimum usage commitment",
      value: `${formatM(opportunity.proposal.annualMinimumUsageUsd)} / year`,
    },
    {
      label: "Implementation support",
      value: `${formatM(opportunity.proposal.implementationSupportUsd)} equivalent`,
    },
    {
      label: "Exclusivity",
      value: EXCLUSIVITY_LABELS[opportunity.proposal.exclusivity],
    },
    { label: "Renewal", value: opportunity.proposal.renewalMechanics ?? "—" },
    {
      label: "Total proposed economic cost",
      value: formatM(totalEconomicCostUsd),
      emphasis: true,
    },
    {
      label: "Net present value (NPV) of cash cost (12%)",
      value: formatM(valuation.npvCashCostUsd),
    },
  ];

  const negotiationPosition = recommendation
    ? [
        { label: "Opening position", value: formatM(recommendation.openingPositionUsd) },
        { label: "Target", value: formatM(recommendation.targetValueUsd) },
        { label: "Reservation value", value: formatM(recommendation.reservationValueUsd) },
        { label: "Walk-away point", value: formatM(recommendation.walkAwayValueUsd) },
      ]
    : [];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {opportunity.name}
          </h1>
          <Badge variant="outline">Synthetic</Badge>
          <Badge variant="secondary">Stage {stageLabel(opportunity.stage)}</Badge>
          <Badge variant="secondary">Archetype {archetypeLabel(opportunity.archetype)}</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Should we sign this partnership? Start here: weigh the proposed cost against
          confidence-adjusted value (CAV) across three scenarios, then check what still needs
          evidence before you commit.
        </p>
        <OpportunityTabs />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity summary</CardTitle>
              <CardDescription>Synthetic demo case — what is on the table and where it stands</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Atlas is a fictional specialist-information provider: a strong proprietary corpus,
                an API used by professional-services firms, solid editorial processes, and limited
                global distribution. The proposal is a three-year hybrid partnership — an annual
                data-license fee plus API access, product integration, joint enterprise
                distribution, limited category exclusivity, and a minimum usage commitment.
              </p>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Case created</dt>
                  <dd className="tabular-nums">{formatDate(opportunity.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Decision date</dt>
                  <dd className="tabular-nums">
                    {opportunity.decisionDate ? formatDate(opportunity.decisionDate) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Renewal option</dt>
                  <dd className="tabular-nums">
                    {opportunity.renewalDate ? formatDate(opportunity.renewalDate) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>{opportunity.proposal.sourceLabel}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposed economics</CardTitle>
              <CardDescription>What the deal would cost over its term</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {proposedEconomics.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell
                        className={
                          row.emphasis
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {row.label}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          row.emphasis ? "font-semibold" : ""
                        }`}
                      >
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {recommendation ? (
            <Card>
              <CardHeader>
                <CardTitle>Our current recommendation</CardTitle>
                <CardDescription>
                  Deterministic engine output ·{" "}
                  <span className="inline-flex items-center gap-1">
                    <Badge variant="outline">AI draft</Badge>
                    <span className="text-muted-foreground">not human-approved</span>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{decisionLabel(recommendation.decision)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {recommendation.preferredStructure}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Base CAV" value={formatM(base.confidenceAdjustedValueUsd)} />
                  <Stat label="Proposed cost" value={formatM(totalEconomicCostUsd)} />
                  <Stat
                    label="Base gap"
                    value={formatM(
                      base.confidenceAdjustedValueUsd - totalEconomicCostUsd,
                      { sign: true },
                    )}
                    negative={
                      base.confidenceAdjustedValueUsd - totalEconomicCostUsd < 0
                    }
                  />
                  <Stat label="Upside gap" value={formatM(valuation.gapUsd.upside, { sign: true })} />
                </div>

                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
                  {recommendation.rationale.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Negotiation position
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anchor</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {negotiationPosition.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="text-muted-foreground">{row.label}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Value range</CardTitle>
              <CardDescription>
                Gross partnership value (GPV) vs confidence-adjusted value (CAV) per scenario,
                against the {formatM(totalEconomicCostUsd)} proposed cost. Only the upside
                scenario pays for itself — the base and downside cases fall short.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ValueRangeChart
                data={valueRangeData}
                costUsd={totalEconomicCostUsd}
                maxUsd={valueRangeMaxUsd}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-right">GPV</TableHead>
                    <TableHead className="text-right">CF</TableHead>
                    <TableHead className="text-right">CAV</TableHead>
                    <TableHead className="text-right">Gap vs cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuation.scenarios.map((scenario) => {
                    const gapUsd = valuation.gapUsd[scenario.name];
                    return (
                      <TableRow key={scenario.id}>
                        <TableCell className="font-medium">
                          {scenarioLabel(scenario.name)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatM(scenario.grossPartnershipValueUsd)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPercent(scenario.confidenceFactor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatM(scenario.confidenceAdjustedValueUsd)}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            gapUsd < 0 ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {formatM(gapUsd, { sign: true })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top sensitivities</CardTitle>
              <CardDescription>
                Which assumptions move the answer most — where better evidence would change the
                recommendation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assumption</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Downside</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Upside</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitivities.map(({ assumption, numeric }) => {
                    const scenarioValues = assumption.scenarioValues as Record<
                      "downside" | "base" | "upside",
                      AssumptionValue
                    >;
                    return (
                      <TableRow key={assumption.id}>
                        <TableCell className="font-medium">
                          {assumption.label}
                          {!numeric ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (qualitative)
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {ASSUMPTION_CATEGORY_LABELS[assumption.category]}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAssumptionValue(scenarioValues.downside)}
                          {assumption.unit ? ` ${assumption.unit}` : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAssumptionValue(scenarioValues.base)}
                          {assumption.unit ? ` ${assumption.unit}` : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAssumptionValue(scenarioValues.upside)}
                          {assumption.unit ? ` ${assumption.unit}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{assumption.confidence}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Confidence score</CardTitle>
              <CardDescription>How much we trust the base estimate</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-semibold tabular-nums">
                  {formatPercent(base.confidenceFactor)}
                </span>
                <span className="text-sm text-muted-foreground">
                  average of five dimensions
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {confidenceDims.map((dim) => (
                  <div key={dim.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{dim.label}</span>
                      <span className="tabular-nums">{formatPercent(dim.value)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{ width: `${Math.round(dim.value * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What still needs evidence</CardTitle>
              <CardDescription>Evidence that could move the recommendation</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendation && recommendation.missingEvidence.length > 0 ? (
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
                  {recommendation.missingEvidence.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">None recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What could hurt the case</CardTitle>
              <CardDescription>High- and critical-severity risks, all still open</CardDescription>
            </CardHeader>
            <CardContent>
              {highRisks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {highRisks.map((risk) => (
                    <div key={risk.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{risk.description}</span>
                        <Badge variant="destructive">{SEVERITY_LABELS[risk.severity]}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="secondary">{riskCategoryLabel(risk.category)}</Badge>
                        <span className="inline-flex items-center">
                          P {formatProbability(risk.probability)}
                        </span>
                        {risk.impactUsd ? (
                          <span className="tabular-nums">impact {formatM(risk.impactUsd)}</span>
                        ) : null}
                      </div>
                      {risk.mitigation ? (
                        <p className="text-xs text-muted-foreground">{risk.mitigation}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">None recorded.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval status</CardTitle>
              <CardDescription>Who has signed off, and what is still pending</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {opportunity.approvals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gate</TableHead>
                      <TableHead>Approver</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunity.approvals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">{approval.gate}</TableCell>
                        <TableCell className="text-muted-foreground">{approval.approver}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Approved</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Final decision approval is pending — the recommendation is an AI draft awaiting
                human sign-off.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  negative?: boolean;
}

function Stat({ label, value, negative }: StatProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-heading text-lg font-semibold tabular-nums ${
          negative ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
