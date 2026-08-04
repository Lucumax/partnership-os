import { computeRecommendation, computeValuation, type ScenarioEconomics } from "@/lib/valuation/engine";
import { comparabilityScore, type ComparabilityTarget } from "@/lib/valuation/formulas";
import type {
  Archetype,
  Assumption,
  ComparableTransaction,
  Opportunity,
  ProposalTerms,
  Recommendation,
  RiskItem,
  ScenarioInput,
} from "@/lib/domain/types";

export const ATLAS_ANALYSIS_DATE = "2025-06-30T00:00:00Z";

export const ATLAS_PROPOSAL: ProposalTerms = {
  termMonths: 36,
  cashConsiderationUsd: 31.0,
  upfrontCashUsd: 4.0,
  annualLicenseFeeUsd: 6.0,
  annualMinimumUsageUsd: 3.0,
  implementationSupportUsd: 1.5,
  minimumCommitmentUsd: 9.0,
  usageCommitment: 3.0,
  exclusivity: "limited",
  territory: ["global"],
  dataRights: [
    { use: "training", scope: "negotiable", note: "TBD with legal review" },
    { use: "inference", scope: "granted" },
    { use: "outputs", scope: "granted" },
    { use: "model_weights", scope: "denied" },
    { use: "feedback_data", scope: "negotiable" },
    { use: "derivative_works", scope: "negotiable" },
  ],
  productRights: [
    { use: "inference", scope: "granted" },
    { use: "outputs", scope: "granted" },
  ],
  distributionCommitments: ["Joint enterprise distribution"],
  implementationObligations: ["Joint implementation team"],
  renewalMechanics: "Two-year renewal option after year three",
  terminationRights: "For cause; convenience after year two with fee",
  nonCashValueNotes: "Implementation support valued at $1.5M equivalent",
  regulatoryFlags: {
    hsr_merger_control: "not_applicable",
    exclusivity_preferential_access: "open",
    ai_act: "not_applicable",
    data_export: "not_applicable",
    foreign_investment: "not_applicable",
    responsible_scaling: "not_applicable",
  },
  sourceLabel: "Synthetic — Atlas Knowledge Systems term sheet",
  sourceType: "synthetic",
};

export const ATLAS_ECONOMICS: ScenarioEconomics = {
  cashConsiderationUsd: ATLAS_PROPOSAL.cashConsiderationUsd,
  implementationCostUsd: ATLAS_PROPOSAL.implementationSupportUsd,
  termMonths: ATLAS_PROPOSAL.termMonths,
};

export const RISK_DOWNSIDE_ADOPTION: RiskItem = {
  id: "atlas-risk-downside-adoption",
  category: "commercial",
  description: "Adoption shortfall",
  probability: 0.5,
  impactUsd: 2.0,
  severity: "medium",
  mitigation: "Milestone-based adoption targets",
  owner: "deal.lead",
  status: "open",
};

export const RISK_DOWNSIDE_IMPLEMENTATION: RiskItem = {
  id: "atlas-risk-downside-implementation",
  category: "operational",
  description: "Implementation overrun",
  probability: 0.5,
  impactUsd: 1.0,
  severity: "low",
  mitigation: "Joint implementation team with scope guardrails",
  owner: "delivery.lead",
  status: "open",
};

export const RISK_BASE_ADOPTION: RiskItem = {
  id: "atlas-risk-base-adoption",
  category: "commercial",
  description: "Adoption shortfall",
  probability: 0.4,
  impactUsd: 3.0,
  severity: "medium",
  mitigation: "Milestone-based adoption targets",
  owner: "deal.lead",
  status: "open",
};

export const RISK_BASE_REGULATORY: RiskItem = {
  id: "atlas-risk-base-regulatory",
  category: "regulatory",
  description: "Regulatory change",
  probability: 0.2,
  impactUsd: 3.0,
  severity: "high",
  regulatoryFlag: "exclusivity_preferential_access",
  mitigation: "Change-of-law and renegotiation clauses",
  owner: "legal.reviewer",
  status: "open",
};

export const RISK_BASE_KEYPERSON: RiskItem = {
  id: "atlas-risk-base-keyperson",
  category: "operational",
  description: "Key-person dependency",
  probability: 0.2,
  impactUsd: 1.0,
  severity: "low",
  mitigation: "Second-source knowledge transfer plan",
  owner: "delivery.lead",
  status: "open",
};

export const RISK_UPSIDE_REGULATORY: RiskItem = {
  id: "atlas-risk-upside-regulatory",
  category: "regulatory",
  description: "Regulatory change",
  probability: 0.15,
  impactUsd: 5.0,
  severity: "critical",
  regulatoryFlag: "exclusivity_preferential_access",
  mitigation: "Change-of-law and renegotiation clauses",
  owner: "legal.reviewer",
  status: "open",
};

export const RISK_UPSIDE_RENEWAL: RiskItem = {
  id: "atlas-risk-upside-renewal",
  category: "commercial",
  description: "Renewal failure",
  probability: 0.3,
  impactUsd: 2.5,
  severity: "medium",
  mitigation: "Renewal option tied to usage and product metrics",
  owner: "deal.lead",
  status: "open",
};

export const ATLAS_RISKS: RiskItem[] = [
  RISK_DOWNSIDE_ADOPTION,
  RISK_DOWNSIDE_IMPLEMENTATION,
  RISK_BASE_ADOPTION,
  RISK_BASE_REGULATORY,
  RISK_BASE_KEYPERSON,
  RISK_UPSIDE_REGULATORY,
  RISK_UPSIDE_RENEWAL,
];

export const ATLAS_ASSUMPTIONS: Assumption[] = [
  {
    id: "assumption-adoption-rate",
    category: "usage",
    label: "Adoption rate as a share of plan",
    value: 0.75,
    unit: "share of plan",
    scenarioValues: { downside: 0.45, base: 0.75, upside: 1.1 },
    confidence: "medium",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-12T00:00:00Z",
  },
  {
    id: "assumption-integration-months",
    category: "timing",
    label: "Integration duration",
    value: 7,
    unit: "months",
    scenarioValues: { downside: 12, base: 7, upside: 4 },
    confidence: "medium",
    owner: "delivery.lead",
    lastUpdatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "assumption-renewal-probability",
    category: "renewal",
    label: "Renewal probability after year three",
    value: 0.6,
    unit: "probability",
    scenarioValues: { downside: 0.35, base: 0.6, upside: 0.8 },
    confidence: "low",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "assumption-distribution-value",
    category: "revenue",
    label: "Enterprise distribution value",
    value: "moderate",
    scenarioValues: { downside: "limited", base: "moderate", upside: "strong" },
    confidence: "low",
    owner: "strategy.ops.lead",
    lastUpdatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "assumption-implementation-cost",
    category: "cost",
    label: "Implementation cost outcome",
    value: "expected",
    scenarioValues: { downside: "higher than expected", base: "expected", upside: "expected" },
    confidence: "medium",
    owner: "delivery.lead",
    lastUpdatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "assumption-discount-rate",
    category: "timing",
    label: "Annual discount rate for contract cash flows",
    value: 0.12,
    unit: "annual rate",
    confidence: "high",
    owner: "system",
    lastUpdatedAt: "2025-06-01T00:00:00Z",
  },
];

export const ATLAS_SCENARIO_INPUTS: ScenarioInput[] = [
  {
    id: "scenario-downside",
    name: "downside",
    directFinancialValueUsd: 10.0,
    usageCustomerValueUsd: 3.0,
    productCapabilityValueUsd: 2.0,
    distributionValueUsd: 2.0,
    strategicOptionValueUsd: 1.0,
    learningValueUsd: 0.5,
    brandValueUsd: 0.5,
    implementationCostUsd: 1.0,
    exclusivityOpportunityCostUsd: 1.0,
    concentrationLockInCostUsd: 0.5,
    exitCostUsd: 1.0,
    risks: [RISK_DOWNSIDE_ADOPTION, RISK_DOWNSIDE_IMPLEMENTATION],
    confidenceFactorDims: {
      evidenceQuality: 0.4,
      assumptionStability: 0.5,
      comparableQuality: 0.6,
      implementationCertainty: 0.6,
      partnerExecutionConfidence: 0.65,
    },
  },
  {
    id: "scenario-base",
    name: "base",
    directFinancialValueUsd: 26.0,
    usageCustomerValueUsd: 8.0,
    productCapabilityValueUsd: 4.0,
    distributionValueUsd: 3.0,
    strategicOptionValueUsd: 2.0,
    learningValueUsd: 0.5,
    brandValueUsd: 1.0,
    implementationCostUsd: 1.5,
    exclusivityOpportunityCostUsd: 3.0,
    concentrationLockInCostUsd: 1.0,
    exitCostUsd: 2.0,
    risks: [RISK_BASE_ADOPTION, RISK_BASE_REGULATORY, RISK_BASE_KEYPERSON],
    confidenceFactorDims: {
      evidenceQuality: 0.6,
      assumptionStability: 0.7,
      comparableQuality: 0.75,
      implementationCertainty: 0.8,
      partnerExecutionConfidence: 0.75,
    },
  },
  {
    id: "scenario-upside",
    name: "upside",
    directFinancialValueUsd: 46.0,
    usageCustomerValueUsd: 13.0,
    productCapabilityValueUsd: 7.0,
    distributionValueUsd: 5.0,
    strategicOptionValueUsd: 2.0,
    learningValueUsd: 0.5,
    brandValueUsd: 1.0,
    implementationCostUsd: 1.5,
    exclusivityOpportunityCostUsd: 5.0,
    concentrationLockInCostUsd: 1.5,
    exitCostUsd: 3.0,
    risks: [RISK_UPSIDE_REGULATORY, RISK_UPSIDE_RENEWAL],
    confidenceFactorDims: {
      evidenceQuality: 0.7,
      assumptionStability: 0.8,
      comparableQuality: 0.8,
      implementationCertainty: 0.8,
      partnerExecutionConfidence: 0.8,
    },
  },
];

export const ATLAS_COMPARABILITY_TARGET: ComparabilityTarget = {
  archetype: "hybrid",
  exclusivity: "limited",
  termMonths: 36,
  integrationBurden: 3,
};

function withComparability(
  raw: Omit<ComparableTransaction, "comparabilityScore" | "recencyDecayFactor">,
): ComparableTransaction {
  const base: ComparableTransaction = { ...raw, comparabilityScore: 0 };
  const result = comparabilityScore(base, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
  return {
    ...raw,
    comparabilityScore: result.rawScore,
    recencyDecayFactor: result.recencyDecayFactor,
  };
}

export const ATLAS_COMPARABLES: ComparableTransaction[] = [
  withComparability({
    id: "cmp-northstar-data-license",
    name: "Northstar Data License",
    archetype: "data_licensing",
    announcementDate: "2023-09-15T00:00:00Z",
    disclosedValueUsd: 12.0,
    termMonths: 36,
    cashComponentUsd: 12.0,
    exclusivity: "none",
    integrationBurden: 1,
    sourceLabel: "Synthetic — fictional comparable for demo",
    sourceQuality: 4,
    normalizationFactors: [
      {
        label: "No distribution channel",
        factor: 0.8,
        direction: "down",
        note: "Synthetic normalization; purely licensing economics",
      },
    ],
    notes: "Recurring specialist corpus license with no distribution component.",
    synthetic: true,
  }),
  withComparability({
    id: "cmp-meridian-api-integration",
    name: "Meridian API Integration",
    archetype: "product_integration",
    announcementDate: "2024-01-20T00:00:00Z",
    disclosedValueUsd: 8.5,
    termMonths: 24,
    cashComponentUsd: 6.5,
    inKindValueUsd: 2.0,
    exclusivity: "none",
    minimumUsage: 2.0,
    integrationBurden: 2,
    sourceLabel: "Synthetic — fictional comparable for demo",
    sourceQuality: 4,
    normalizationFactors: [
      {
        label: "Usage-based pricing",
        factor: 1.1,
        direction: "up",
        note: "Synthetic normalization; usage ramp assumed steeper",
      },
    ],
    notes: "Product integration with usage-based economics.",
    synthetic: true,
  }),
  withComparability({
    id: "cmp-harbor-enterprise-channel",
    name: "Harbor Enterprise Channel",
    archetype: "distribution",
    announcementDate: "2024-04-10T00:00:00Z",
    disclosedValueUsd: 20.0,
    termMonths: 48,
    cashComponentUsd: 20.0,
    exclusivity: "limited",
    minimumUsage: 5.0,
    distributionCommitment: "Reseller channel with annual minimums",
    integrationBurden: 4,
    sourceLabel: "Synthetic — fictional comparable for demo",
    sourceQuality: 3,
    normalizationFactors: [
      {
        label: "Longer term than Atlas proposal",
        factor: 0.9,
        direction: "down",
        note: "Synthetic normalization; 48 vs 36 months",
      },
    ],
    notes: "Distribution partnership with minimum commitments.",
    synthetic: true,
  }),
  withComparability({
    id: "cmp-keystone-strategic-alliance",
    name: "Keystone Strategic Alliance",
    archetype: "strategic_ecosystem",
    announcementDate: "2023-11-05T00:00:00Z",
    disclosedValueUsd: 15.0,
    termMonths: 36,
    inKindValueUsd: 15.0,
    exclusivity: "full",
    integrationBurden: 5,
    sourceLabel: "Synthetic — fictional comparable for demo",
    sourceQuality: 3,
    normalizationFactors: [
      {
        label: "Co-development and joint GTM",
        factor: 1.0,
        direction: "up",
        note: "Synthetic normalization; no cash economics disclosed",
      },
    ],
    notes: "Strategic alliance with co-development and joint go-to-market.",
    synthetic: true,
  }),
  withComparability({
    id: "cmp-pioneer-hybrid-agreement",
    name: "Pioneer Hybrid Agreement",
    archetype: "hybrid",
    announcementDate: "2024-06-12T00:00:00Z",
    disclosedValueUsd: 30.0,
    termMonths: 36,
    cashComponentUsd: 24.0,
    inKindValueUsd: 6.0,
    exclusivity: "limited",
    minimumUsage: 4.0,
    distributionCommitment: "Joint enterprise GTM",
    integrationBurden: 3,
    sourceLabel: "Synthetic — fictional comparable for demo",
    sourceQuality: 5,
    normalizationFactors: [
      {
        label: "Closest structure to Atlas proposal",
        factor: 1.0,
        direction: "up",
        note: "Synthetic normalization; same archetype, term, and exclusivity",
      },
    ],
    notes: "License, API, integration, and limited exclusivity.",
    synthetic: true,
  }),
];

const ATLAS_VALUATION = computeValuation({
  proposal: ATLAS_PROPOSAL,
  scenarios: ATLAS_SCENARIO_INPUTS,
});

export const ATLAS_SCENARIOS = ATLAS_VALUATION.scenarios;

export const ATLAS_RECOMMENDATION: Recommendation = computeRecommendation({
  scenarios: ATLAS_VALUATION.byName,
  proposal: ATLAS_PROPOSAL,
  risks: ATLAS_RISKS,
  totalEconomicCostUsd: ATLAS_VALUATION.totalEconomicCostUsd,
  missingEvidence: [
    "Share of corpus that is unique versus replaceable",
    "Percentage of content licensable for model and product use",
    "Evidence supporting expected enterprise distribution",
    "Implementation resources contractually committed",
    "How usage will be measured and audited",
    "Quality, freshness, and rights warranties",
    "Protections if regulatory or policy requirements change",
    "Which rights survive termination",
    "How exclusivity narrows other strategic options",
    "Milestone structure that would support a pilot",
  ],
  changeConditions: [
    "Broad category exclusivity is removed or made milestone-based",
    "Fixed three-year minimums are replaced with performance milestones",
    "Upfront economics are reduced",
    "Termination rights are tied to implementation and quality thresholds",
    "Restrictions that materially limit alternative partnerships are lifted",
  ],
});

export const ATLAS_OPPORTUNITY: Opportunity = {
  id: "atlas-opportunity-001",
  name: "Atlas Knowledge Systems",
  partnerAlias: "Atlas",
  archetype: "hybrid",
  stage: "valuation",
  owner: "strategy.ops.lead",
  createdAt: "2025-06-01T00:00:00Z",
  decisionDate: "2025-08-01T00:00:00Z",
  renewalDate: "2028-06-01T00:00:00Z",
  proposal: ATLAS_PROPOSAL,
  assumptions: ATLAS_ASSUMPTIONS,
  selectedComparableIds: ATLAS_COMPARABLES.map((comparable) => comparable.id),
  scenarios: ATLAS_VALUATION.scenarios,
  risks: ATLAS_RISKS,
  recommendation: ATLAS_RECOMMENDATION,
  approvals: [
    {
      id: "approval-intake-001",
      gate: "Intake completeness",
      approver: "strategy.ops.lead",
      approvedAt: "2025-06-02T00:00:00Z",
      note: "All terms captured; sources labeled synthetic.",
    },
    {
      id: "approval-assumptions-001",
      gate: "Assumption lock",
      approver: "deal.lead",
      approvedAt: "2025-06-05T00:00:00Z",
    },
    {
      id: "approval-comparables-001",
      gate: "Comparable set",
      approver: "research.stakeholder",
      approvedAt: "2025-06-10T00:00:00Z",
    },
  ],
  auditEvents: [
    {
      id: "audit-001",
      timestamp: "2025-06-01T00:00:00Z",
      actor: "system",
      actorType: "system",
      action: "opportunity.created",
      field: "proposal",
      newValue: "Atlas Knowledge Systems term sheet",
      rationale: "Synthetic intake from the demo case",
    },
    {
      id: "audit-002",
      timestamp: "2025-06-12T00:00:00Z",
      actor: "deal.lead",
      actorType: "human",
      action: "assumption.updated",
      field: "adoption_rate.base",
      previousValue: 0.7,
      newValue: 0.75,
      rationale: "Updated after partner discovery call",
    },
    {
      id: "audit-003",
      timestamp: "2025-06-15T00:00:00Z",
      actor: "system",
      actorType: "system",
      action: "recommendation.generated",
      field: "recommendation.decision",
      newValue: ATLAS_RECOMMENDATION.decision,
      rationale: "Deterministic engine output",
    },
  ],
};

export interface ArchetypeMeta {
  id: Archetype;
  label: string;
  description: string;
}

export const PARTNERSHIP_ARCHETYPES: ArchetypeMeta[] = [
  {
    id: "data_licensing",
    label: "Data Licensing",
    description: "Content, corpus, specialist datasets, or recurring access.",
  },
  {
    id: "product_integration",
    label: "Product Integration",
    description: "APIs, embedded capabilities, co-developed features.",
  },
  {
    id: "distribution",
    label: "Distribution",
    description: "Channel access, reseller, cloud marketplace, enterprise distribution.",
  },
  {
    id: "strategic_ecosystem",
    label: "Strategic Ecosystem",
    description: "Joint go-to-market, standards, research, or platform alignment.",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    description: "Combinations of licensing, integration, distribution, and strategic rights.",
  },
];
