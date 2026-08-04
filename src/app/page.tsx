import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
import { KpiCard } from "@/components/portfolio/kpi-card";
import { StageFunnelChart, type StageFunnelDatum } from "@/components/portfolio/stage-funnel";
import {
  ValueVsSpendScatter,
  type ValueVsSpendDatum,
} from "@/components/portfolio/value-vs-spend-scatter";
import {
  ConcentrationByArchetypeChart,
  type ConcentrationDatum,
} from "@/components/portfolio/concentration-by-archetype";
import {
  formatAssumptionValue,
  formatDate,
  formatM,
} from "@/components/portfolio/format";
import {
  decisionLabel,
  stageLabel,
} from "@/components/portfolio/labels";
import {
  ATLAS_ANALYSIS_DATE,
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_SCENARIO_INPUTS,
  PARTNERSHIP_ARCHETYPES,
} from "@/lib/fixtures";
import type { OpportunityStage } from "@/lib/domain/types";
import { computeValuation } from "@/lib/valuation/engine";
import { monthsBetween } from "@/lib/valuation/formulas";

export const metadata: Metadata = {
  title: "Portfolio Dashboard — Partnership OS",
  description: "Confidence-adjusted view of pipeline value, commitments, and decisions.",
};

const FUNNEL_STAGES: OpportunityStage[] = [
  "inbound",
  "diligence",
  "valuation",
  "negotiation",
  "approval",
  "contracting",
  "active",
  "declined",
];

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(monthsBetween(fromIso, toIso) * 30.4375);
}

function roundUpToTens(value: number): number {
  return Math.ceil(value / 10) * 10;
}

export default function DashboardPage() {
  const analysisDate = ATLAS_ANALYSIS_DATE;
  const opportunity = ATLAS_OPPORTUNITY;
  const opportunities = [opportunity];

  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });
  const base = valuation.byName.base;
  const totalEconomicCostUsd = valuation.totalEconomicCostUsd;

  const pipelineValueUsd = opportunities.reduce(
    (sum) => sum + base.grossPartnershipValueUsd,
    0,
  );
  const confidenceAdjustedValueUsd = opportunities.reduce(
    (sum) => sum + base.confidenceAdjustedValueUsd,
    0,
  );
  const proposedSpendUsd = opportunities.reduce(
    (sum) => sum + totalEconomicCostUsd,
    0,
  );
  const activeNegotiations = opportunities.filter(
    (item) =>
      item.stage === "valuation" ||
      item.stage === "negotiation" ||
      item.stage === "approval",
  ).length;
  const decisionsDueIn30Days = opportunities.filter((item) => {
    if (!item.decisionDate) {
      return false;
    }
    const days = daysBetween(analysisDate, item.decisionDate);
    return days >= 0 && days <= 30;
  }).length;
  const highRiskOpportunities = opportunities.filter((item) =>
    item.risks.some((risk) => risk.severity === "high" || risk.severity === "critical"),
  ).length;

  const funnelData: StageFunnelDatum[] = FUNNEL_STAGES.map((stage) => ({
    stage: stageLabel(stage),
    count: opportunities.filter((item) => item.stage === stage).length,
    active: opportunity.stage === stage,
  }));

  const scatterData: ValueVsSpendDatum[] = opportunities.map((item) => ({
    name: item.name,
    spendUsd: totalEconomicCostUsd,
    valueUsd: base.confidenceAdjustedValueUsd,
    gapUsd: base.confidenceAdjustedValueUsd - totalEconomicCostUsd,
  }));
  const scatterMaxUsd = roundUpToTens(
    Math.max(...scatterData.map((datum) => Math.max(datum.spendUsd, datum.valueUsd))),
  );

  const concentrationData: ConcentrationDatum[] = PARTNERSHIP_ARCHETYPES.map((meta) => {
    const valueUsd = opportunities
      .filter((item) => item.archetype === meta.id)
      .reduce((sum) => sum + base.confidenceAdjustedValueUsd, 0);
    return {
      archetype: meta.label,
      valueUsd,
      share: confidenceAdjustedValueUsd > 0 ? (valueUsd / confidenceAdjustedValueUsd) * 100 : 0,
    };
  }).filter((datum) => datum.valueUsd > 0);
  const concentrationMaxUsd = roundUpToTens(confidenceAdjustedValueUsd);

  const upcomingDecisions = opportunities
    .filter((item) => item.decisionDate)
    .map((item) => ({
      name: item.name,
      decisionDate: item.decisionDate as string,
      stage: stageLabel(item.stage),
      recommendation: item.recommendation ? decisionLabel(item.recommendation.decision) : "—",
      confidenceAdjustedValueUsd: base.confidenceAdjustedValueUsd,
      gapUsd: base.confidenceAdjustedValueUsd - totalEconomicCostUsd,
    }))
    .sort((a, b) => a.decisionDate.localeCompare(b.decisionDate));

  const assumptionChangeBySlug = new Map<
    string,
    { previousValue: unknown; newValue: unknown; timestamp: string; actor: string }
  >();
  for (const event of opportunity.auditEvents) {
    if (event.action !== "assumption.updated") {
      continue;
    }
    const slug = (event.field ?? "").split(".")[0].replace(/_/g, "-");
    assumptionChangeBySlug.set(slug, {
      previousValue: event.previousValue,
      newValue: event.newValue,
      timestamp: event.timestamp,
      actor: event.actor,
    });
  }

  const recentAssumptions = [...opportunity.assumptions]
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt))
    .map((assumption) => {
      const slug = assumption.id.replace("assumption-", "");
      const change = assumptionChangeBySlug.get(slug);
      return { assumption, change };
    });

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Partnership portfolio
        </h1>
        <p className="text-sm text-muted-foreground">
          Confidence-adjusted view of pipeline value, commitments, and decisions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Pipeline value"
          value={formatM(pipelineValueUsd)}
          caption="Base-case gross value"
        />
        <KpiCard
          label="Confidence-adjusted value"
          value={formatM(confidenceAdjustedValueUsd)}
          caption="Base-case CAV"
        />
        <KpiCard
          label="Proposed spend"
          value={formatM(proposedSpendUsd)}
          caption="Total economic cost"
        />
        <KpiCard label="Active negotiations" value={activeNegotiations} caption="Valuation → approval" />
        <KpiCard
          label="Decisions due in 30 days"
          value={decisionsDueIn30Days}
          caption={
            opportunity.decisionDate
              ? `Next ${formatDate(opportunity.decisionDate)}`
              : "None scheduled"
          }
        />
        <KpiCard label="High-risk opportunities" value={highRiskOpportunities} caption="High or critical" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Stage funnel</CardTitle>
            <CardDescription>Opportunity count by pipeline stage</CardDescription>
          </CardHeader>
          <CardContent>
            <StageFunnelChart
              data={funnelData}
              maxCount={Math.max(...funnelData.map((datum) => datum.count), 1)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Single seeded case ({opportunity.name}) currently in {stageLabel(opportunity.stage)}.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Value versus spend</CardTitle>
            <CardDescription>
              Base-case confidence-adjusted value vs proposed economic cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValueVsSpendScatter data={scatterData} maxUsd={scatterMaxUsd} />
            <p className="mt-2 text-xs text-muted-foreground">
              Dashed line marks value = spend (break-even). Points below it carry a negative gap.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Upcoming decisions</CardTitle>
            <CardDescription>Decision dates across the portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Decision date</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead className="text-right">CAV</TableHead>
                  <TableHead className="text-right">Gap vs cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDecisions.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      <Link
                        href="/opportunities/atlas"
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {row.name}
                        <ArrowRight className="size-3" aria-hidden="true" />
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(row.decisionDate)}</TableCell>
                    <TableCell>{row.stage}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.recommendation}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatM(row.confidenceAdjustedValueUsd)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        row.gapUsd < 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {formatM(row.gapUsd, { sign: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Concentration by archetype</CardTitle>
            <CardDescription>Confidence-adjusted value by partnership archetype</CardDescription>
          </CardHeader>
          <CardContent>
            <ConcentrationByArchetypeChart data={concentrationData} maxValueUsd={concentrationMaxUsd} />
            <p className="mt-2 text-xs text-muted-foreground">
              {concentrationData.length === 1
                ? "Portfolio is 100% concentrated in one archetype until additional cases are seeded."
                : "Archetype mix across the portfolio."}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle>Recent assumption changes</CardTitle>
            <CardDescription>Most recently updated assumptions driving valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assumption</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base value</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAssumptions.map(({ assumption, change }) => (
                  <TableRow key={assumption.id}>
                    <TableCell className="font-medium">{assumption.label}</TableCell>
                    <TableCell>{assumption.category}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAssumptionValue(assumption.value)}
                      {assumption.unit ? ` ${assumption.unit}` : ""}
                    </TableCell>
                    <TableCell>
                      {change ? (
                        <Badge variant="outline">
                          {formatAssumptionValue(change.previousValue as number | string | boolean)} →{" "}
                          {formatAssumptionValue(change.newValue as number | string | boolean)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(assumption.lastUpdatedAt)}</TableCell>
                    <TableCell>{assumption.owner}</TableCell>
                    <TableCell>{formatPercentByConfidence(assumption.confidence)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatPercentByConfidence(confidence: "low" | "medium" | "high"): string {
  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}
