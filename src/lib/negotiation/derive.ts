import type { GiveGetOption, Opportunity, ProposalTerms, Recommendation, Scenario } from "@/lib/domain/types";

export interface GiveGetRow {
  give: string;
  get: string;
  economicImpactUsd: number;
  strategicImpact: string;
  riskEffect: string;
}

const ECONOMIC_FACTORS = [0.15, 0.25, 0.3] as const;
const ECONOMIC_SIGNS = [-1, 1, 1] as const;

const STRATEGIC_IMPACTS = [
  "Strengthens the commitment signal; aligns spend with measured usage.",
  "Preserves category optionality outside defined segments.",
  "Creates information value before a full-term commitment.",
] as const;

const RISK_EFFECTS = [
  "Reduces commercial adoption risk via usage-based economics.",
  "Reduces concentration and lock-in risk from exclusivity.",
  "Reduces implementation and exit risk via milestone gates.",
] as const;

export function deriveGiveGetRows(
  options: GiveGetOption[],
  base: Scenario,
  upside: Scenario,
): GiveGetRow[] {
  const headroom = upside.confidenceAdjustedValueUsd - base.confidenceAdjustedValueUsd;
  return options.map((option, index) => {
    const factor = ECONOMIC_FACTORS[index % ECONOMIC_FACTORS.length];
    const sign = ECONOMIC_SIGNS[index % ECONOMIC_SIGNS.length];
    const economicImpactUsd = sign * Math.round(headroom * factor * 10) / 10;
    return {
      give: option.give,
      get: option.get,
      economicImpactUsd,
      strategicImpact: STRATEGIC_IMPACTS[index % STRATEGIC_IMPACTS.length],
      riskEffect: RISK_EFFECTS[index % RISK_EFFECTS.length],
    };
  });
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

export function deriveRedLines(opportunity: Opportunity, recommendation: Recommendation): string[] {
  const lines: string[] = [];
  for (const right of opportunity.proposal.dataRights ?? []) {
    if (right.scope === "denied") {
      lines.push(`Do not grant ${humanize(right.use)} access.`);
    }
  }
  const flags = opportunity.proposal.regulatoryFlags ?? {};
  if (
    flags.exclusivity_preferential_access === "open" ||
    flags.exclusivity_preferential_access === "flagged"
  ) {
    lines.push("No preferential-access exclusivity without legal sign-off.");
  }
  for (const condition of recommendation.changeConditions) {
    lines.push(`Decline unless ${condition.charAt(0).toLowerCase()}${condition.slice(1)}.`);
  }
  return lines;
}

export function derivePartnerQuestions(proposal: ProposalTerms): string[] {
  const questions: string[] = [];
  for (const right of proposal.dataRights ?? []) {
    if (right.scope === "negotiable") {
      questions.push(`Can Atlas grant ${humanize(right.use)} rights on the current terms?`);
    }
  }
  for (const obligation of proposal.implementationObligations ?? []) {
    questions.push(`Which resources are contractually committed for "${obligation.toLowerCase()}"?`);
  }
  if (proposal.renewalMechanics) {
    questions.push("What milestone structure would support a pilot before the renewal option?");
  }
  return questions;
}
