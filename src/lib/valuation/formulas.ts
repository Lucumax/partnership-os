import type {
  Archetype,
  ComparableTransaction,
  ConfidenceFactorDims,
  Exclusivity,
  IntegrationBurden,
  ProposalTerms,
  RiskItem,
} from "@/lib/domain/types";

export const COMPARABILITY_WEIGHTS = {
  archetype: 0.25,
  rightsExclusivity: 0.2,
  economicStructure: 0.2,
  termRenewal: 0.1,
  distributionUsage: 0.1,
  integrationBurden: 0.1,
  sourceQuality: 0.05,
} as const;

export type ComparabilityDimensionKey = keyof typeof COMPARABILITY_WEIGHTS;

export const COMPARABILITY_DIMENSION_KEYS: readonly ComparabilityDimensionKey[] = [
  "archetype",
  "rightsExclusivity",
  "economicStructure",
  "termRenewal",
  "distributionUsage",
  "integrationBurden",
  "sourceQuality",
];

export const DEFAULT_DISCOUNT_RATE = 0.12;

export interface GpvComponents {
  directFinancialValueUsd: number;
  usageCustomerValueUsd: number;
  productCapabilityValueUsd: number;
  distributionValueUsd: number;
  strategicOptionValueUsd: number;
  learningValueUsd: number;
  brandValueUsd: number;
}

export interface GpvCosts {
  implementationCostUsd: number;
  exclusivityOpportunityCostUsd: number;
  concentrationLockInCostUsd: number;
  exitCostUsd: number;
}

export function grossPartnershipValue(
  components: GpvComponents,
  costs: GpvCosts,
  expectedRiskCostUsd: number,
): number {
  return (
    components.directFinancialValueUsd +
    components.usageCustomerValueUsd +
    components.productCapabilityValueUsd +
    components.distributionValueUsd +
    components.strategicOptionValueUsd +
    components.learningValueUsd +
    components.brandValueUsd -
    costs.implementationCostUsd -
    costs.exclusivityOpportunityCostUsd -
    expectedRiskCostUsd -
    costs.concentrationLockInCostUsd -
    costs.exitCostUsd
  );
}

export function confidenceAdjustedValue(gpvUsd: number, confidenceFactor: number): number {
  return gpvUsd * confidenceFactor;
}

export function expectedRiskCost(risks: RiskItem[]): number {
  return risks.reduce((sum, risk) => sum + risk.probability * (risk.impactUsd ?? 0), 0);
}

export function roi(
  confidenceAdjustedValueUsd: number,
  cashConsiderationUsd: number,
  implementationCostUsd: number,
): number {
  const denominator = cashConsiderationUsd + implementationCostUsd;
  if (denominator === 0) {
    return 0;
  }
  return (confidenceAdjustedValueUsd - cashConsiderationUsd - implementationCostUsd) / denominator;
}

export function presentValue(amountUsd: number, years: number, discountRate: number): number {
  return amountUsd / Math.pow(1 + discountRate, years);
}

export function cashScheduleYears(proposal: ProposalTerms): number {
  return proposal.termMonths / 12;
}

export function npvOfCashSchedule(proposal: ProposalTerms, discountRate: number): number {
  const years = cashScheduleYears(proposal);
  let npv = proposal.upfrontCashUsd;
  for (let year = 1; year <= years; year += 1) {
    npv += presentValue(proposal.annualLicenseFeeUsd, year, discountRate);
    npv += presentValue(proposal.annualMinimumUsageUsd, year, discountRate);
  }
  return npv;
}

export function confidenceFactor(dims: ConfidenceFactorDims): number {
  return (
    (dims.evidenceQuality +
      dims.assumptionStability +
      dims.comparableQuality +
      dims.implementationCertainty +
      dims.partnerExecutionConfidence) /
    5
  );
}

export function paybackMonths(
  confidenceAdjustedValueUsd: number,
  totalEconomicCostUsd: number,
  termMonths: number,
): number | undefined {
  if (confidenceAdjustedValueUsd <= 0 || confidenceAdjustedValueUsd < totalEconomicCostUsd) {
    return undefined;
  }
  return (totalEconomicCostUsd / confidenceAdjustedValueUsd) * termMonths;
}

export function monthsBetween(fromIso: string, toIso: string): number {
  const fromMs = Date.parse(fromIso);
  const toMs = Date.parse(toIso);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return 0;
  }
  return (toMs - fromMs) / (30.4375 * 24 * 60 * 60 * 1000);
}

export function recencyDecayFactor(announcementDate: string, analysisDate: string): number {
  const months = monthsBetween(announcementDate, analysisDate);
  if (months <= 24) {
    return 1;
  }
  return Math.max(0.5, 1 - (months - 24) / 48);
}

export function applyRecencyDecay(score: number, announcementDate: string, analysisDate: string): number {
  return score * recencyDecayFactor(announcementDate, analysisDate);
}

export interface ComparabilityTarget {
  archetype: Archetype;
  exclusivity: Exclusivity;
  termMonths: number;
  integrationBurden: IntegrationBurden;
}

export interface ComparabilityDimensionScore {
  key: ComparabilityDimensionKey;
  weight: number;
  score: number;
  weighted: number;
}

export interface ComparabilityResult {
  rawScore: number;
  recencyDecayFactor: number;
  adjustedScore: number;
  dimensions: ComparabilityDimensionScore[];
}

const EXCLUSIVITY_RANK: Record<Exclusivity, number> = {
  none: 0,
  limited: 1,
  category: 2,
  full: 3,
};

function archetypeSimilarity(target: Archetype, other: Archetype): number {
  if (target === other) {
    return 1;
  }
  if (target === "hybrid" || other === "hybrid") {
    return 0.7;
  }
  return 0.3;
}

function exclusivitySimilarity(target: Exclusivity, other: Exclusivity): number {
  return 1 - Math.abs(EXCLUSIVITY_RANK[target] - EXCLUSIVITY_RANK[other]) / 3;
}

function economicStructureSimilarity(comparable: ComparableTransaction): number {
  const hasCash = comparable.cashComponentUsd != null || comparable.disclosedValueUsd != null;
  const hasInKind = comparable.inKindValueUsd != null;
  if (hasCash && hasInKind) {
    return 1;
  }
  if (hasCash) {
    return 0.8;
  }
  if (hasInKind) {
    return 0.6;
  }
  return 0.4;
}

function termSimilarity(comparable: ComparableTransaction, targetTermMonths: number): number {
  if (comparable.termMonths == null) {
    return 0.5;
  }
  return 1 - Math.min(Math.abs(comparable.termMonths - targetTermMonths), 36) / 36;
}

function distributionUsageSimilarity(comparable: ComparableTransaction): number {
  let score = 0.4;
  if (comparable.minimumUsage != null) {
    score += 0.3;
  }
  if (comparable.distributionCommitment != null && comparable.distributionCommitment.length > 0) {
    score += 0.3;
  }
  return Math.min(score, 1);
}

function integrationBurdenSimilarity(target: IntegrationBurden, other: IntegrationBurden): number {
  return 1 - Math.abs(target - other) / 4;
}

export function comparabilityScore(
  comparable: ComparableTransaction,
  target: ComparabilityTarget,
  analysisDate?: string,
): ComparabilityResult {
  const dimensionScores: Record<ComparabilityDimensionKey, number> = {
    archetype: archetypeSimilarity(target.archetype, comparable.archetype),
    rightsExclusivity: exclusivitySimilarity(target.exclusivity, comparable.exclusivity),
    economicStructure: economicStructureSimilarity(comparable),
    termRenewal: termSimilarity(comparable, target.termMonths),
    distributionUsage: distributionUsageSimilarity(comparable),
    integrationBurden: integrationBurdenSimilarity(target.integrationBurden, comparable.integrationBurden),
    sourceQuality: comparable.sourceQuality / 5,
  };

  const dimensions: ComparabilityDimensionScore[] = COMPARABILITY_DIMENSION_KEYS.map((key) => {
    const weight = COMPARABILITY_WEIGHTS[key];
    const score = dimensionScores[key];
    return { key, weight, score, weighted: weight * score };
  });

  const rawScore = dimensions.reduce((sum, dimension) => sum + dimension.weighted, 0);
  const decay = analysisDate ? recencyDecayFactor(comparable.announcementDate, analysisDate) : 1;

  return {
    rawScore,
    recencyDecayFactor: decay,
    adjustedScore: rawScore * decay,
    dimensions,
  };
}
