import type { Opportunity, Recommendation } from "@/lib/domain/types";
import type { ValuationResult } from "@/lib/valuation/engine";
import { deriveGiveGetRows, deriveRedLines, derivePartnerQuestions } from "@/lib/negotiation/derive";
import { formatUsdM, formatUsdMDelta } from "@/lib/export/format";

export function toMarkdown(
  opportunity: Opportunity,
  valuation: ValuationResult,
  recommendation: Recommendation,
): string {
  const base = valuation.byName.base;
  const rows = deriveGiveGetRows(recommendation.giveGetOptions, base, opportunity.proposal);
  const redLines = deriveRedLines(opportunity, recommendation);
  const questions = derivePartnerQuestions(opportunity.proposal);
  const approvalStatus = recommendation.approvedBy
    ? `Approved by ${recommendation.approvedBy}${recommendation.approvedAt ? ` at ${recommendation.approvedAt}` : ""}`
    : "Awaiting human approval";
  const priorApprovals = opportunity.approvals
    .map((approval) => `- ${approval.gate}: ${approval.approver} (${approval.approvedAt.slice(0, 10)})`)
    .join("\n");

  const sections = [
    `# Negotiation brief — ${opportunity.name}`,
    "",
    "> AI draft · deterministic engine · source records: 3 scenarios, " +
      `${opportunity.selectedComparableIds.length} comparables · synthetic data only`,
    "",
    `## Decision`,
    "",
    `**${recommendation.decision}** — ${recommendation.preferredStructure}`,
    "",
    "## Negotiation position",
    "",
    "| Metric | Value |",
    "|---|---|",
    `| Opening position | ${formatUsdM(recommendation.openingPositionUsd)} |`,
    `| Target | ${formatUsdM(recommendation.targetValueUsd)} |`,
    `| Reservation value | ${formatUsdM(recommendation.reservationValueUsd)} |`,
    `| Walk-away point | ${formatUsdM(recommendation.walkAwayValueUsd)} |`,
    `| Preferred structure | ${recommendation.preferredStructure} |`,
    "",
    "## Scenario economics",
    "",
    "| Scenario | Gross value | Confidence factor | Confidence-adjusted value | Gap vs cost |",
    "|---|---|---|---|---|",
    ...(["downside", "base", "upside"] as const).map((name) => {
      const scenario = valuation.byName[name];
      return `| ${name} | ${formatUsdM(scenario.grossPartnershipValueUsd)} | ${scenario.confidenceFactor.toFixed(2)} | ${formatUsdM(scenario.confidenceAdjustedValueUsd)} | ${formatUsdM(valuation.gapUsd[name])} |`;
    }),
    "",
    `> Total proposed economic cost: ${formatUsdM(valuation.totalEconomicCostUsd)}`,
    "",
    "## Give / get matrix",
    "",
    "| We give | We get | Economic impact | Strategic impact | Risk effect |",
    "|---|---|---|---|---|",
    ...rows.map(
      (row) =>
        `| ${row.give} | ${row.get} | ${formatUsdMDelta(row.economicImpactUsd)} | ${row.strategicImpact} | ${row.riskEffect} |`,
    ),
    "",
    "## Red lines",
    "",
    ...redLines.map((line) => `- ${line}`),
    "",
    "## Missing evidence",
    "",
    ...recommendation.missingEvidence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Partner questions",
    "",
    ...questions.map((question) => `- ${question}`),
    "",
    "## Conditions that change the recommendation",
    "",
    ...recommendation.changeConditions.map((condition) => `- ${condition}`),
    "",
    "## Rationale",
    "",
    ...recommendation.rationale.map((point) => `- ${point}`),
    "",
    "## Human approval",
    "",
    `- Status: ${approvalStatus}`,
    "",
    "Prior approval gates:",
    "",
    priorApprovals,
  ];

  return sections.join("\n") + "\n";
}
