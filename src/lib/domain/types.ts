export type Archetype =
  | "data_licensing"
  | "product_integration"
  | "distribution"
  | "strategic_ecosystem"
  | "hybrid";

export type OpportunityStage =
  | "inbound"
  | "diligence"
  | "valuation"
  | "negotiation"
  | "approval"
  | "contracting"
  | "active"
  | "declined";

export type Exclusivity = "none" | "limited" | "category" | "full";

export type ScenarioName = "downside" | "base" | "upside";

export type SourceType = "synthetic" | "public" | "internal";

export type Severity = "low" | "medium" | "high" | "critical";

export type RiskCategory =
  | "commercial"
  | "legal"
  | "privacy"
  | "safety"
  | "reputational"
  | "technical"
  | "operational"
  | "concentration"
  | "regulatory";

export type AssumptionCategory =
  | "usage"
  | "revenue"
  | "cost"
  | "timing"
  | "risk"
  | "renewal"
  | "strategic"
  | "other";

export type Confidence = "low" | "medium" | "high";

export type Decision = "pursue" | "pilot" | "restructure" | "decline" | "defer";

export type IntegrationBurden = 1 | 2 | 3 | 4 | 5;

export type SourceQuality = 1 | 2 | 3 | 4 | 5;

export type AiUseRight =
  | "training"
  | "inference"
  | "outputs"
  | "model_weights"
  | "feedback_data"
  | "derivative_works";

export interface DataRight {
  use: AiUseRight;
  scope: "granted" | "denied" | "negotiable";
  note?: string;
}

export type RegulatoryFlag =
  | "hsr_merger_control"
  | "exclusivity_preferential_access"
  | "ai_act"
  | "data_export"
  | "foreign_investment"
  | "responsible_scaling";

export type RegulatoryFlagStatus = "open" | "not_applicable" | "flagged";

export type AssumptionValue = number | string | boolean;

export interface ScenarioValues {
  downside: AssumptionValue;
  base: AssumptionValue;
  upside: AssumptionValue;
}

export interface ProposalTerms {
  termMonths: number;
  cashConsiderationUsd: number;
  upfrontCashUsd: number;
  annualLicenseFeeUsd: number;
  annualMinimumUsageUsd: number;
  implementationSupportUsd: number;
  minimumCommitmentUsd?: number;
  usageCommitment?: number;
  exclusivity: Exclusivity;
  territory?: string[];
  dataRights?: DataRight[];
  productRights?: DataRight[];
  distributionCommitments?: string[];
  implementationObligations?: string[];
  renewalMechanics?: string;
  terminationRights?: string;
  nonCashValueNotes?: string;
  regulatoryFlags?: Partial<Record<RegulatoryFlag, RegulatoryFlagStatus>>;
  sourceLabel: string;
  sourceType: SourceType;
}

export interface Assumption {
  id: string;
  category: AssumptionCategory;
  label: string;
  value: AssumptionValue;
  unit?: string;
  scenarioValues?: ScenarioValues;
  evidenceId?: string;
  confidence: Confidence;
  owner: string;
  lastUpdatedAt: string;
}

export interface NormalizationFactor {
  label: string;
  factor: number;
  direction: "up" | "down";
  note?: string;
}

export interface ComparableTransaction {
  id: string;
  name: string;
  archetype: Archetype;
  announcementDate: string;
  disclosedValueUsd?: number;
  termMonths?: number;
  cashComponentUsd?: number;
  inKindValueUsd?: number;
  exclusivity: Exclusivity;
  minimumUsage?: number;
  distributionCommitment?: string;
  integrationBurden: IntegrationBurden;
  strategicRights?: string[];
  sourceUrl?: string;
  sourceLabel: string;
  sourceQuality: SourceQuality;
  comparabilityScore: number;
  recencyDecayFactor?: number;
  normalizationFactors: NormalizationFactor[];
  notes: string;
  synthetic: boolean;
}

export interface ConfidenceFactorDims {
  evidenceQuality: number;
  assumptionStability: number;
  comparableQuality: number;
  implementationCertainty: number;
  partnerExecutionConfidence: number;
}

export interface Scenario {
  id: string;
  name: ScenarioName;
  directFinancialValueUsd: number;
  usageCustomerValueUsd: number;
  productCapabilityValueUsd: number;
  distributionValueUsd: number;
  strategicOptionValueUsd: number;
  learningValueUsd: number;
  brandValueUsd: number;
  implementationCostUsd: number;
  exclusivityOpportunityCostUsd: number;
  concentrationLockInCostUsd: number;
  exitCostUsd: number;
  expectedRiskCostUsd: number;
  confidenceFactor: number;
  confidenceFactorDims: ConfidenceFactorDims;
  grossPartnershipValueUsd: number;
  confidenceAdjustedValueUsd: number;
  roi: number;
  paybackMonths?: number;
}

export interface RiskItem {
  id: string;
  category: RiskCategory;
  description: string;
  probability: number;
  impactUsd?: number;
  severity: Severity;
  mitigation?: string;
  owner?: string;
  status: "open" | "mitigated" | "accepted";
  regulatoryFlag?: RegulatoryFlag;
}

export interface GiveGetOption {
  give: string;
  get: string;
}

export interface Recommendation {
  decision: Decision;
  openingPositionUsd: number;
  targetValueUsd: number;
  reservationValueUsd: number;
  walkAwayValueUsd: number;
  preferredStructure: string;
  rationale: string[];
  giveGetOptions: GiveGetOption[];
  missingEvidence: string[];
  changeConditions: string[];
  generatedBy: "human" | "ai_draft";
  approvedBy?: string;
  approvedAt?: string;
}

export interface Evidence {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceDate?: string;
  excerpt?: string;
  confidence: Confidence;
  notes?: string;
}

export interface Approval {
  id: string;
  gate: string;
  approver: string;
  approvedAt: string;
  note?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "human" | "system" | "ai";
  action: string;
  field?: string;
  previousValue?: unknown;
  newValue?: unknown;
  rationale?: string;
  evidenceIds?: string[];
}

export interface Opportunity {
  id: string;
  name: string;
  partnerAlias: string;
  archetype: Archetype;
  stage: OpportunityStage;
  owner: string;
  createdAt: string;
  decisionDate?: string;
  renewalDate?: string;
  proposal: ProposalTerms;
  assumptions: Assumption[];
  selectedComparableIds: string[];
  scenarios: Scenario[];
  risks: RiskItem[];
  recommendation?: Recommendation;
  approvals: Approval[];
  auditEvents: AuditEvent[];
}

export interface ScenarioInput {
  id: string;
  name: ScenarioName;
  directFinancialValueUsd: number;
  usageCustomerValueUsd: number;
  productCapabilityValueUsd: number;
  distributionValueUsd: number;
  strategicOptionValueUsd: number;
  learningValueUsd: number;
  brandValueUsd: number;
  implementationCostUsd: number;
  exclusivityOpportunityCostUsd: number;
  concentrationLockInCostUsd: number;
  exitCostUsd: number;
  risks: RiskItem[];
  confidenceFactorDims: ConfidenceFactorDims;
}
