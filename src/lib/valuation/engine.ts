import {
  DEFAULT_DISCOUNT_RATE,
  comparabilityScore,
  confidenceAdjustedValue,
  confidenceFactor,
  expectedRiskCost,
  grossPartnershipValue,
  npvOfCashSchedule,
  paybackMonths,
  roi,
  type ComparabilityTarget,
  type GpvComponents,
  type GpvCosts,
} from "@/lib/valuation/formulas";
import type {
  ComparableTransaction,
  Decision,
  GiveGetOption,
  ProposalTerms,
  Recommendation,
  RiskItem,
  Scenario,
  ScenarioInput,
  ScenarioName,
} from "@/lib/domain/types";

export interface ScenarioEconomics {
  cashConsiderationUsd: number;
  implementationCostUsd: number;
  termMonths: number;
}

export function computeScenario(input: ScenarioInput, economics: ScenarioEconomics): Scenario {
  const components: GpvComponents = {
    directFinancialValueUsd: input.directFinancialValueUsd,
    usageCustomerValueUsd: input.usageCustomerValueUsd,
    productCapabilityValueUsd: input.productCapabilityValueUsd,
    distributionValueUsd: input.distributionValueUsd,
    strategicOptionValueUsd: input.strategicOptionValueUsd,
    learningValueUsd: input.learningValueUsd,
    brandValueUsd: input.brandValueUsd,
  };

  const costs: GpvCosts = {
    implementationCostUsd: input.implementationCostUsd,
    exclusivityOpportunityCostUsd: input.exclusivityOpportunityCostUsd,
    concentrationLockInCostUsd: input.concentrationLockInCostUsd,
    exitCostUsd: input.exitCostUsd,
  };

  const expectedRiskCostUsd = expectedRiskCost(input.risks);
  const grossPartnershipValueUsd = grossPartnershipValue(components, costs, expectedRiskCostUsd);
  const cf = confidenceFactor(input.confidenceFactorDims);
  const confidenceAdjustedValueUsd = confidenceAdjustedValue(grossPartnershipValueUsd, cf);

  return {
    id: input.id,
    name: input.name,
    ...components,
    ...costs,
    expectedRiskCostUsd,
    confidenceFactor: cf,
    confidenceFactorDims: input.confidenceFactorDims,
    grossPartnershipValueUsd,
    confidenceAdjustedValueUsd,
    roi: roi(confidenceAdjustedValueUsd, economics.cashConsiderationUsd, economics.implementationCostUsd),
    paybackMonths: paybackMonths(confidenceAdjustedValueUsd, economics.cashConsiderationUsd, economics.termMonths),
  };
}

export interface ValuationInput {
  proposal: ProposalTerms;
  scenarios: ScenarioInput[];
  discountRate?: number;
}

export interface ValuationResult {
  scenarios: Scenario[];
  byName: Record<ScenarioName, Scenario>;
  totalEconomicCostUsd: number;
  nominalCashCostUsd: number;
  npvCashCostUsd: number;
  discountRate: number;
  gapUsd: Record<ScenarioName, number>;
}

function findScenario(scenarios: Scenario[], name: ScenarioName): Scenario {
  const found = scenarios.find((scenario) => scenario.name === name);
  if (!found) {
    throw new Error(`Valuation requires a "${name}" scenario`);
  }
  return found;
}

export function computeValuation(input: ValuationInput): ValuationResult {
  const discountRate = input.discountRate ?? DEFAULT_DISCOUNT_RATE;
  const economics: ScenarioEconomics = {
    cashConsiderationUsd: input.proposal.cashConsiderationUsd,
    implementationCostUsd: input.proposal.implementationSupportUsd,
    termMonths: input.proposal.termMonths,
  };

  const scenarios = input.scenarios.map((scenario) => computeScenario(scenario, economics));
  const byName: Record<ScenarioName, Scenario> = {
    downside: findScenario(scenarios, "downside"),
    base: findScenario(scenarios, "base"),
    upside: findScenario(scenarios, "upside"),
  };

  const nominalCashCostUsd = input.proposal.cashConsiderationUsd;
  const gap = (name: ScenarioName) => byName[name].confidenceAdjustedValueUsd - nominalCashCostUsd;

  return {
    scenarios,
    byName,
    totalEconomicCostUsd: nominalCashCostUsd,
    nominalCashCostUsd,
    npvCashCostUsd: npvOfCashSchedule(input.proposal, discountRate),
    discountRate,
    gapUsd: {
      downside: gap("downside"),
      base: gap("base"),
      upside: gap("upside"),
    },
  };
}

export interface RecommendationInput {
  scenarios: Record<ScenarioName, Scenario>;
  proposal: ProposalTerms;
  risks: RiskItem[];
  totalEconomicCostUsd: number;
  missingEvidence: string[];
  changeConditions: string[];
  /** Discount rate used only to translate the value ceiling into nominal cash terms for the
   * walk-away threshold (see computeRecommendation). Defaults to DEFAULT_DISCOUNT_RATE, matching
   * computeValuation's default so the ladder and the valuation use the same time-value assumption
   * unless a caller overrides both consistently. */
  discountRate?: number;
}

const GIVE_GET_OPTIONS: GiveGetOption[] = [
  { give: "Higher minimum usage commitment", get: "Lower annual license fee" },
  { give: "Reduced exclusivity limited to defined segments", get: "Implementation support from the partner" },
  { give: "Accept a 9-12 month pilot before the full term", get: "Renewal option tied to usage and product milestones" },
];

function decisionFor(baseGapUsd: number, upsideGapUsd: number, downsideGapUsd: number): Decision {
  if (upsideGapUsd < 0) {
    return "decline";
  }
  if (downsideGapUsd >= 0 || baseGapUsd >= 0) {
    return "pursue";
  }
  return "pilot";
}

function preferredStructureFor(decision: Decision): string {
  switch (decision) {
    case "pursue":
      return "Full-term agreement structured around the base-case target with staged exclusivity milestones.";
    case "pilot":
      return "9-12 month pilot: reduced upfront, usage-based license fee, segment-limited exclusivity, renewal option tied to milestones.";
    case "restructure":
      return "Restructured term sheet: lower fixed commitments, milestone-based exclusivity, stronger termination rights.";
    case "decline":
      return "Decline; preserve optionality for alternative partnerships.";
    case "defer":
      return "Defer decision pending additional evidence.";
  }
}

export function computeRecommendation(input: RecommendationInput): Recommendation {
  const base = input.scenarios.base;
  const upside = input.scenarios.upside;
  const downside = input.scenarios.downside;

  const baseGapUsd = base.confidenceAdjustedValueUsd - input.totalEconomicCostUsd;
  const upsideGapUsd = upside.confidenceAdjustedValueUsd - input.totalEconomicCostUsd;
  const downsideGapUsd = downside.confidenceAdjustedValueUsd - input.totalEconomicCostUsd;
  const decision = decisionFor(baseGapUsd, upsideGapUsd, downsideGapUsd);

  // --- Negotiation ladder -----------------------------------------------------------------
  // A negotiation ladder is four positions on PRICE (what we pay), not four scenario valuations.
  // Value sets the ceiling: we should not pay more than the deal is worth on the case we are
  // willing to underwrite (the base case). Everything below traces to an input shown elsewhere
  // in the app (scenario CAVs, the proposal's nominal cash cost, and its NPV).
  //
  // Confidence-adjusted value (CAV) is itself a present-value judgment -- the value stack is not
  // re-discounted (see scripts/reconcile_check.py) -- so CAV compares apples-to-apples with the
  // NPV of the proposed cash schedule, not with its nominal total. That NPV-vs-nominal
  // relationship is exactly the ratio the engine already computes for the proposal, so we reuse
  // it rather than inventing a new constant:
  const discountRate = input.discountRate ?? DEFAULT_DISCOUNT_RATE;
  const npvCashCostUsd = npvOfCashSchedule(input.proposal, discountRate);
  const nominalCashCostUsd = input.totalEconomicCostUsd;
  const nominalToPresentValueRatio = npvCashCostUsd > 0 ? nominalCashCostUsd / npvCashCostUsd : 1;

  // Opening: the lowest number we can defend with evidence -- what the deal is worth to us if the
  // risks we have flagged materialize (the downside case), in present-value terms.
  const openingPositionUsd = downside.confidenceAdjustedValueUsd;

  // Reservation: the value ceiling. The base case is the case we underwrite, so its
  // confidence-adjusted value is the most we should pay in present-value terms -- paying more
  // trades away expected value regardless of how the negotiation feels in the room.
  const reservationValueUsd = base.confidenceAdjustedValueUsd;

  // Walk-away: the same ceiling, restated in nominal cash terms -- the unit the term sheet is
  // actually written and negotiated in -- using the proposal's own payment schedule. Because
  // future cash is discounted, nominal >= present value for any schedule with future payments, so
  // walkAwayValueUsd >= reservationValueUsd by construction; no separate assumption is introduced.
  const walkAwayValueUsd = reservationValueUsd * nominalToPresentValueRatio;

  // Target: the outcome we steer to -- the midpoint between the opening anchor and the
  // reservation ceiling, the standard "anchor low, target the middle, cap at the ceiling" ladder.
  const targetValueUsd = (openingPositionUsd + reservationValueUsd) / 2;

  const toM = (value: number) => `${value.toFixed(1)}M`;
  const askVsWalkAway = nominalCashCostUsd > walkAwayValueUsd ? "above" : "at or below";
  const rationale = [
    `Opening position (${toM(openingPositionUsd)}) is the downside-case confidence-adjusted value: the lowest number we can defend with evidence if the risks we have flagged materialize. It moves with downside-case assumptions and confidence factors.`,
    `Target (${toM(targetValueUsd)}) is the midpoint between the opening anchor and the reservation ceiling -- the outcome we steer the conversation toward, leaving room to move up without exceeding what we can justify.`,
    `Reservation value (${toM(reservationValueUsd)}) is the value ceiling: the base-case confidence-adjusted value, in present-value terms, is what this partnership is worth on the case we are willing to underwrite. We should not pay more than this; it moves with base-case assumptions, comparables, and confidence factors.`,
    `Walk-away threshold (${toM(walkAwayValueUsd)}) restates that same ceiling in nominal cash terms using the proposal's own ${input.proposal.termMonths}-month payment schedule (nominal ${toM(nominalCashCostUsd)} vs NPV ${toM(npvCashCostUsd)} at ${(discountRate * 100).toFixed(0)}%). The current ask is ${askVsWalkAway} this threshold, which is part of why the recommendation is to ${decision}.`,
    `Upside-case confidence-adjusted value is ${toM(upside.confidenceAdjustedValueUsd)} (gap ${toM(upsideGapUsd)} vs the nominal ask); it depends on adoption and distribution assumptions that are not yet evidenced and is not used to set the ceiling -- paying up to an optimistic-case value would give away the risk-adjustment the model exists to protect.`,
  ];

  return {
    decision,
    openingPositionUsd,
    targetValueUsd,
    reservationValueUsd,
    walkAwayValueUsd,
    preferredStructure: preferredStructureFor(decision),
    rationale,
    giveGetOptions: GIVE_GET_OPTIONS,
    missingEvidence: input.missingEvidence,
    changeConditions: input.changeConditions,
    generatedBy: "ai_draft",
  };
}

export interface ComparabilityOutput {
  rawScore: number;
  recencyDecayFactor: number;
  adjustedScore: number;
  comparable: ComparableTransaction;
}

export function computeComparability(
  comparable: ComparableTransaction,
  target: ComparabilityTarget,
  analysisDate?: string,
): ComparabilityOutput {
  const result = comparabilityScore(comparable, target, analysisDate);
  return {
    rawScore: result.rawScore,
    recencyDecayFactor: result.recencyDecayFactor,
    adjustedScore: result.adjustedScore,
    comparable: { ...comparable, recencyDecayFactor: result.recencyDecayFactor },
  };
}
