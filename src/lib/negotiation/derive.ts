import { DEFAULT_DISCOUNT_RATE, npvOfCashSchedule, presentValue } from "@/lib/valuation/formulas";
import type { GiveGetOption, Opportunity, ProposalTerms, Recommendation, Scenario } from "@/lib/domain/types";
import { formatUsdM } from "@/lib/export/format";

export interface GiveGetRow {
  give: string;
  get: string;
  economicImpactUsd: number;
  /**
   * "ceiling": economicImpactUsd is a real, model-grounded upper bound on the value in play for
   * this concession -- not a negotiated point estimate. The actual outcome depends on a split or
   * scope the term sheet doesn't specify (e.g. how a fee is re-mixed, how narrow a segment carve-out
   * ends up being). We say so in the strategicImpact text rather than presenting it as a price.
   * "directional": no defensible dollar figure can be derived from the current terms at all; the
   * sign and scale are not priced, and economicImpactUsd is 0 rather than a fabricated number.
   */
  economicImpactBasis: "ceiling" | "directional";
  strategicImpact: string;
  riskEffect: string;
}

// NOTE: the three formulas below are matched to GIVE_GET_OPTIONS in valuation/engine.ts by index.
// This is a fixed, hand-curated list for the seeded demo (not a generic engine over arbitrary
// concessions), so index coupling is acceptable here -- but if that list's order or membership
// changes, these formulas need to move with it.

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Present value of a level annual amount paid once a year for the given term. */
function npvOfAnnualAmount(amountUsd: number, termMonths: number, discountRate: number): number {
  const years = termMonths / 12;
  let total = 0;
  for (let year = 1; year <= years; year += 1) {
    total += presentValue(amountUsd, year, discountRate);
  }
  return total;
}

export function deriveGiveGetRows(
  options: GiveGetOption[],
  base: Scenario,
  proposal: ProposalTerms,
  discountRate: number = DEFAULT_DISCOUNT_RATE,
): GiveGetRow[] {
  return options.map((option, index) => {
    if (index === 0) {
      // Higher minimum usage commitment <-> lower annual license fee. The proposal's annual
      // license fee is a fixed amount, not one that floats with usage, so there is nothing in the
      // term sheet that specifies how much of it would actually move in this trade -- that split
      // is exactly what negotiation would decide. We report the NPV of the full annual license
      // fee as a ceiling (the most this line item is worth), not as the price of the trade.
      const ceiling = round1(npvOfAnnualAmount(proposal.annualLicenseFeeUsd, proposal.termMonths, discountRate));
      return {
        give: option.give,
        get: option.get,
        economicImpactUsd: ceiling,
        economicImpactBasis: "ceiling",
        strategicImpact:
          `Strengthens the commitment signal and aligns spend with measured usage. Ceiling only: up to ${formatUsdM(ceiling)} ` +
          "(NPV of the full annual license fee) -- the actual fee reduction depends on a usage/fee split not yet negotiated.",
        riskEffect: "Reduces commercial adoption risk via usage-based economics.",
      };
    }
    if (index === 1) {
      // Reduced exclusivity limited to defined segments <-> implementation support from the
      // partner. Both sides of this trade map onto cost lines the valuation model already carries
      // for the base case (exclusivityOpportunityCostUsd, implementationCostUsd). Fully
      // eliminating both is the ceiling; a segment-limited exclusivity concession and
      // partner-funded implementation are each partial, so this is an upper bound, confidence
      // adjusted the same way the rest of the value stack is.
      const ceiling = round1(
        (base.exclusivityOpportunityCostUsd + base.implementationCostUsd) * base.confidenceFactor,
      );
      return {
        give: option.give,
        get: option.get,
        economicImpactUsd: ceiling,
        economicImpactBasis: "ceiling",
        strategicImpact:
          `Preserves category optionality outside defined segments. Ceiling only: up to ${formatUsdM(ceiling)} ` +
          "(confidence-adjusted value of the base-case exclusivity-opportunity and implementation cost lines) -- actual recovery depends on how narrow the agreed segments are.",
        riskEffect: "Reduces concentration and lock-in risk from exclusivity.",
      };
    }
    // Accept a 9-12 month pilot before the full term <-> renewal option tied to usage and product
    // milestones. This changes cash actually committed: compare the NPV of the full-term schedule
    // against the NPV of a schedule that stops after a 12-month pilot, using the same real
    // proposal terms and discount rate the rest of the model uses. The difference is cash
    // deferred while the pilot runs, not cash eliminated.
    const fullTermNpv = npvOfCashSchedule(proposal, discountRate);
    const pilotNpv = npvOfCashSchedule({ ...proposal, termMonths: 12 }, discountRate);
    const deferred = round1(fullTermNpv - pilotNpv);
    return {
      give: option.give,
      get: option.get,
      economicImpactUsd: deferred,
      economicImpactBasis: "ceiling",
      strategicImpact:
        `Creates information value before a full-term commitment. Ceiling only: ${formatUsdM(deferred)} ` +
        "of NPV cash deferred (not eliminated) past a 12-month pilot, pending the renewal decision.",
      riskEffect: "Reduces implementation and exit risk via milestone gates.",
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
