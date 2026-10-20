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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/portfolio/kpi-card";
import { PortfolioOnlyBadge } from "@/components/portfolio/portfolio-only-badge";
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
  ATLAS_RECOMMENDATION,
  PARTNERSHIP_ARCHETYPES,
  PORTFOLIO_ENTRIES,
} from "@/lib/fixtures";
import type { OpportunityStage } from "@/lib/domain/types";
import { monthsBetween } from "@/lib/valuation/formulas";

export const metadata: Metadata = {
  title: "Portfolio Dashboard — Partnership OS",
  description:
    "Where the partnership pipeline stands, what is on the table, and what needs a decision next.",
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
  const entries = PORTFOLIO_ENTRIES;
  const atlasEntry = entries.find((entry) => entry.modeled) ?? entries[0];

  const pipelineValueUsd = entries.reduce(
    (sum, entry) => sum + entry.grossValueUsd,
    0,
  );
  const confidenceAdjustedValueUsd = entries.reduce(
    (sum, entry) => sum + entry.confidenceAdjustedValueUsd,
    0,
  );
  const proposedSpendUsd = entries.reduce(
    (sum, entry) => sum + entry.economicCostUsd,
    0,
  );
  const activeNegotiations = entries.filter(
    (entry) =>
      entry.stage === "valuation" ||
      entry.stage === "negotiation" ||
      entry.stage === "approval",
  ).length;
  const decisionsDueIn30Days = entries.filter((entry) => {
    if (!entry.decisionDate) {
      return false;
    }
    const days = daysBetween(analysisDate, entry.decisionDate);
    return days >= 0 && days <= 30;
  }).length;
  const highRiskOpportunities = entries.filter((entry) => entry.highRisk).length;

  const upcoming = entries
    .filter((entry) => entry.decisionDate && daysBetween(analysisDate, entry.decisionDate) >= 0)
    .sort((a, b) => (a.decisionDate as string).localeCompare(b.decisionDate as string));
  const soonestDecision = upcoming[0]?.decisionDate;

  const funnelData: StageFunnelDatum[] = FUNNEL_STAGES.map((stage) => {
    const stageEntries = entries.filter((entry) => entry.stage === stage);
    return {
      stage: stageLabel(stage),
      valueUsd: stageEntries.reduce((sum, entry) => sum + entry.confidenceAdjustedValueUsd, 0),
      count: stageEntries.length,
      active: atlasEntry.stage === stage,
    };
  });
  const funnelMaxValueUsd = roundUpToTens(
    Math.max(...funnelData.map((datum) => datum.valueUsd)),
  );
  // Data-driven finding for the caption: which stage holds the most CAV, and how
  // that compares with the stage holding the most cases. Recomputes automatically
  // if the fixtures ever change shape again.
  const topValueStage = funnelData.reduce((a, b) => (b.valueUsd > a.valueUsd ? b : a));
  const highestCountStage = funnelData.reduce((a, b) => (b.count > a.count ? b : a));
  const pipelineCaption =
    highestCountStage.stage !== topValueStage.stage && highestCountStage.count > 1
      ? `${topValueStage.stage} carries more confidence-adjusted value in ${
          topValueStage.count === 1 ? "a single case" : `${topValueStage.count} cases`
        } (${formatM(topValueStage.valueUsd)}) than the ${highestCountStage.count} cases sitting in ${highestCountStage.stage} combined (${formatM(highestCountStage.valueUsd)}).`
      : `${topValueStage.stage} carries the most confidence-adjusted value in the pipeline, at ${formatM(topValueStage.valueUsd)}.`;

  const scatterData: ValueVsSpendDatum[] = entries.map((entry) => ({
    name: entry.name,
    spendUsd: entry.economicCostUsd,
    valueUsd: entry.confidenceAdjustedValueUsd,
    gapUsd: entry.confidenceAdjustedValueUsd - entry.economicCostUsd,
    active: entry.modeled,
  }));
  const scatterMaxUsd = roundUpToTens(
    Math.max(...scatterData.map((datum) => Math.max(datum.spendUsd, datum.valueUsd))),
  );
  const dealsThatPayForThemselves = scatterData.filter((datum) => datum.gapUsd >= 0).length;

  const concentrationData: ConcentrationDatum[] = PARTNERSHIP_ARCHETYPES.map((meta) => {
    const valueUsd = entries
      .filter((entry) => entry.archetype === meta.id)
      .reduce((sum, entry) => sum + entry.confidenceAdjustedValueUsd, 0);
    return {
      archetype: meta.label,
      valueUsd,
      share: confidenceAdjustedValueUsd > 0 ? (valueUsd / confidenceAdjustedValueUsd) * 100 : 0,
    };
  }).filter((datum) => datum.valueUsd > 0);
  const concentrationMaxUsd = roundUpToTens(
    Math.max(...concentrationData.map((datum) => datum.valueUsd)),
  );
  const topArchetype = concentrationData.reduce((largest, datum) =>
    datum.valueUsd > largest.valueUsd ? datum : largest,
  );

  const upcomingDecisions = entries
    .filter((entry) => entry.decisionDate)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      modeled: entry.modeled,
      href: entry.href,
      decisionDate: entry.decisionDate as string,
      stage: stageLabel(entry.stage),
      recommendation: entry.modeled ? decisionLabel(ATLAS_RECOMMENDATION.decision) : "—",
      confidenceAdjustedValueUsd: entry.confidenceAdjustedValueUsd,
      gapUsd: entry.confidenceAdjustedValueUsd - entry.economicCostUsd,
    }))
    .sort((a, b) => a.decisionDate.localeCompare(b.decisionDate));

  const assumptionChangeBySlug = new Map<
    string,
    { previousValue: unknown; newValue: unknown; timestamp: string; actor: string }
  >();
  for (const event of ATLAS_OPPORTUNITY.auditEvents) {
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

  const recentAssumptions = [...ATLAS_OPPORTUNITY.assumptions]
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
        <p className="max-w-3xl text-sm text-muted-foreground">
          Start here: see where the pipeline stands, which deals would pay for themselves,
          and what needs a decision next.
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          Only Atlas Knowledge Systems is modeled end-to-end in this demo. The other{" "}
          {entries.length - 1} cases populate portfolio-level views — all names and numbers
          are fictional.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Pipeline value"
          value={formatM(pipelineValueUsd)}
          caption="sum of gross partnership value (GPV)"
        />
        <KpiCard
          label="Confidence-adjusted value"
          value={formatM(confidenceAdjustedValueUsd)}
          caption={`risk-discounted across ${entries.length} cases`}
        />
        <KpiCard
          label="Proposed spend"
          value={formatM(proposedSpendUsd)}
          caption="total economic cost across cases"
        />
        <KpiCard
          label="Active negotiations"
          value={activeNegotiations}
          caption="Valuation → approval stages"
        />
        <KpiCard
          label="Decisions due in 30 days"
          value={decisionsDueIn30Days}
          caption={
            soonestDecision ? `Next ${formatDate(soonestDecision)}` : "None scheduled"
          }
        />
        <KpiCard label="High-risk opportunities" value={highRiskOpportunities} caption="high or critical risk" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Pipeline value by stage</CardTitle>
            <CardDescription>
              Confidence-adjusted value (CAV) held at each stage — case count labeled per bar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StageFunnelChart data={funnelData} maxValueUsd={funnelMaxValueUsd} />
            <p className="mt-2 text-xs font-medium text-muted-foreground">{pipelineCaption}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Value versus spend</CardTitle>
            <CardDescription>
              Confidence-adjusted value (CAV) against proposed economic cost, per case.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValueVsSpendScatter data={scatterData} maxUsd={scatterMaxUsd} />
            <p className="mt-2 text-xs text-muted-foreground">
              {dealsThatPayForThemselves} of {scatterData.length} cases land above the
              dashed break-even line and pay for themselves at their proposed cost. The
              others — including Atlas and the case we declined — fall short.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Upcoming decisions</CardTitle>
            <CardDescription>What needs a decision soonest, across the portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption className="sr-only">Upcoming decisions</TableCaption>
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
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.modeled && row.href ? (
                        <Link
                          href={row.href}
                          className="inline-flex items-center gap-1 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {row.name}
                          <ArrowRight className="size-3" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{row.name}</span>
                          <PortfolioOnlyBadge />
                        </span>
                      )}
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
            <CardDescription>Share of portfolio CAV held by each partnership archetype</CardDescription>
          </CardHeader>
          <CardContent>
            <ConcentrationByArchetypeChart data={concentrationData} maxValueUsd={concentrationMaxUsd} />
            <p className="mt-2 text-xs text-muted-foreground">
              {topArchetype.archetype} is the largest bucket at{" "}
              {topArchetype.share.toFixed(0)}% of portfolio confidence-adjusted value —
              real concentration risk to watch, not a single 100% bar.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle>Atlas — recent assumption changes</CardTitle>
            <CardDescription>
              The modeled case&apos;s most recently updated assumptions and what drove them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption className="sr-only">
                Recent assumption changes for Atlas
              </TableCaption>
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
