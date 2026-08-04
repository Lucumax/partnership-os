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

  const toM = (value: number) => `${value.toFixed(1)}M`;
  const rationale = [
    `Base-case confidence-adjusted value is ${toM(base.confidenceAdjustedValueUsd)} against a total proposed economic cost of ${toM(input.totalEconomicCostUsd)} (gap ${toM(baseGapUsd)}).`,
    `Upside-case confidence-adjusted value is ${toM(upside.confidenceAdjustedValueUsd)} (gap ${toM(upsideGapUsd)}); it depends on adoption and distribution assumptions that are not yet evidenced.`,
    `Downside-case confidence-adjusted value is ${toM(downside.confidenceAdjustedValueUsd)} (gap ${toM(downsideGapUsd)}).`,
  ];

  return {
    decision,
    openingPositionUsd: downside.confidenceAdjustedValueUsd,
    targetValueUsd: (base.confidenceAdjustedValueUsd + upside.confidenceAdjustedValueUsd) / 2,
    reservationValueUsd: base.confidenceAdjustedValueUsd,
    walkAwayValueUsd: upside.confidenceAdjustedValueUsd,
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
