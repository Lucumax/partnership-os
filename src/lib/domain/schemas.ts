import { z } from "zod";

export const archetypeSchema = z.enum([
  "data_licensing",
  "product_integration",
  "distribution",
  "strategic_ecosystem",
  "hybrid",
]);

export const opportunityStageSchema = z.enum([
  "inbound",
  "diligence",
  "valuation",
  "negotiation",
  "approval",
  "contracting",
  "active",
  "declined",
]);

export const exclusivitySchema = z.enum(["none", "limited", "category", "full"]);

export const scenarioNameSchema = z.enum(["downside", "base", "upside"]);

export const sourceTypeSchema = z.enum(["synthetic", "public", "internal"]);

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);

export const riskCategorySchema = z.enum([
  "commercial",
  "legal",
  "privacy",
  "safety",
  "reputational",
  "technical",
  "operational",
  "concentration",
  "regulatory",
]);

export const assumptionCategorySchema = z.enum([
  "usage",
  "revenue",
  "cost",
  "timing",
  "risk",
  "renewal",
  "strategic",
  "other",
]);

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const decisionSchema = z.enum(["pursue", "pilot", "restructure", "decline", "defer"]);

export const integrationBurdenSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const sourceQualitySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const aiUseRightSchema = z.enum([
  "training",
  "inference",
  "outputs",
  "model_weights",
  "feedback_data",
  "derivative_works",
]);

export const dataRightScopeSchema = z.enum(["granted", "denied", "negotiable"]);

export const dataRightSchema = z.object({
  use: aiUseRightSchema,
  scope: dataRightScopeSchema,
  note: z.string().optional(),
});

export const regulatoryFlagSchema = z.enum([
  "hsr_merger_control",
  "exclusivity_preferential_access",
  "ai_act",
  "data_export",
  "foreign_investment",
  "responsible_scaling",
]);

export const regulatoryFlagStatusSchema = z.enum(["open", "not_applicable", "flagged"]);

export const assumptionValueSchema = z.union([z.number(), z.string(), z.boolean()]);

export const scenarioValuesSchema = z.object({
  downside: assumptionValueSchema,
  base: assumptionValueSchema,
  upside: assumptionValueSchema,
});

export const proposalTermsSchema = z
  .object({
    termMonths: z.number().int().positive(),
    cashConsiderationUsd: z.number().nonnegative(),
    upfrontCashUsd: z.number().nonnegative(),
    annualLicenseFeeUsd: z.number().nonnegative(),
    annualMinimumUsageUsd: z.number().nonnegative(),
    implementationSupportUsd: z.number().nonnegative(),
    minimumCommitmentUsd: z.number().nonnegative().optional(),
    usageCommitment: z.number().nonnegative().optional(),
    exclusivity: exclusivitySchema,
    territory: z.array(z.string()).optional(),
    dataRights: z.array(dataRightSchema).optional(),
    productRights: z.array(dataRightSchema).optional(),
    distributionCommitments: z.array(z.string()).optional(),
    implementationObligations: z.array(z.string()).optional(),
    renewalMechanics: z.string().optional(),
    terminationRights: z.string().optional(),
    nonCashValueNotes: z.string().optional(),
    regulatoryFlags: z.record(regulatoryFlagSchema, regulatoryFlagStatusSchema).optional(),
    sourceLabel: z.string().min(1),
    sourceType: sourceTypeSchema,
  })
  .refine(
    (proposal) => {
      const years = proposal.termMonths / 12;
      const expected = proposal.upfrontCashUsd + (proposal.annualLicenseFeeUsd + proposal.annualMinimumUsageUsd) * years;
      return Math.abs(expected - proposal.cashConsiderationUsd) < 0.01;
    },
    { message: "cashConsiderationUsd must equal the scheduled cash cost" },
  );

export const assumptionSchema = z.object({
  id: z.string().min(1),
  category: assumptionCategorySchema,
  label: z.string().min(1),
  value: assumptionValueSchema,
  unit: z.string().optional(),
  scenarioValues: scenarioValuesSchema.optional(),
  evidenceId: z.string().optional(),
  confidence: confidenceSchema,
  owner: z.string().min(1),
  lastUpdatedAt: z.string().min(1),
});

export const normalizationFactorSchema = z.object({
  label: z.string().min(1),
  factor: z.number().positive(),
  direction: z.enum(["up", "down"]),
  note: z.string().optional(),
});

export const comparableTransactionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  archetype: archetypeSchema,
  announcementDate: z.string().min(1),
  disclosedValueUsd: z.number().nonnegative().optional(),
  termMonths: z.number().int().positive().optional(),
  cashComponentUsd: z.number().nonnegative().optional(),
  inKindValueUsd: z.number().nonnegative().optional(),
  exclusivity: exclusivitySchema,
  minimumUsage: z.number().nonnegative().optional(),
  distributionCommitment: z.string().optional(),
  integrationBurden: integrationBurdenSchema,
  strategicRights: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional(),
  sourceLabel: z.string().min(1),
  sourceQuality: sourceQualitySchema,
  comparabilityScore: z.number().min(0).max(1),
  recencyDecayFactor: z.number().min(0).max(1).optional(),
  normalizationFactors: z.array(normalizationFactorSchema),
  notes: z.string(),
  synthetic: z.boolean(),
});

export const confidenceFactorDimsSchema = z.object({
  evidenceQuality: z.number().min(0).max(1),
  assumptionStability: z.number().min(0).max(1),
  comparableQuality: z.number().min(0).max(1),
  implementationCertainty: z.number().min(0).max(1),
  partnerExecutionConfidence: z.number().min(0).max(1),
});

export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: scenarioNameSchema,
  directFinancialValueUsd: z.number(),
  usageCustomerValueUsd: z.number(),
  productCapabilityValueUsd: z.number(),
  distributionValueUsd: z.number(),
  strategicOptionValueUsd: z.number(),
  learningValueUsd: z.number(),
  brandValueUsd: z.number(),
  implementationCostUsd: z.number(),
  exclusivityOpportunityCostUsd: z.number(),
  concentrationLockInCostUsd: z.number(),
  exitCostUsd: z.number(),
  expectedRiskCostUsd: z.number(),
  confidenceFactor: z.number().min(0).max(1),
  confidenceFactorDims: confidenceFactorDimsSchema,
  grossPartnershipValueUsd: z.number(),
  confidenceAdjustedValueUsd: z.number(),
  roi: z.number(),
  paybackMonths: z.number().nonnegative().optional(),
});

export const riskItemSchema = z.object({
  id: z.string().min(1),
  category: riskCategorySchema,
  description: z.string().min(1),
  probability: z.number().min(0).max(1),
  impactUsd: z.number().nonnegative().optional(),
  severity: severitySchema,
  mitigation: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["open", "mitigated", "accepted"]),
  regulatoryFlag: regulatoryFlagSchema.optional(),
});

export const giveGetOptionSchema = z.object({
  give: z.string().min(1),
  get: z.string().min(1),
});

export const recommendationSchema = z.object({
  decision: decisionSchema,
  openingPositionUsd: z.number(),
  targetValueUsd: z.number(),
  reservationValueUsd: z.number(),
  walkAwayValueUsd: z.number(),
  preferredStructure: z.string().min(1),
  rationale: z.array(z.string()),
  giveGetOptions: z.array(giveGetOptionSchema),
  missingEvidence: z.array(z.string()),
  changeConditions: z.array(z.string()),
  generatedBy: z.enum(["human", "ai_draft"]),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
});

export const evidenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  sourceType: sourceTypeSchema,
  sourceUrl: z.string().url().optional(),
  sourceDate: z.string().optional(),
  excerpt: z.string().optional(),
  confidence: confidenceSchema,
  notes: z.string().optional(),
});

export const approvalSchema = z.object({
  id: z.string().min(1),
  gate: z.string().min(1),
  approver: z.string().min(1),
  approvedAt: z.string().min(1),
  note: z.string().optional(),
});

export const auditEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  actor: z.string().min(1),
  actorType: z.enum(["human", "system", "ai"]),
  action: z.string().min(1),
  field: z.string().optional(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  rationale: z.string().optional(),
  evidenceIds: z.array(z.string()).optional(),
});

export const scenarioInputSchema = z.object({
  id: z.string().min(1),
  name: scenarioNameSchema,
  directFinancialValueUsd: z.number(),
  usageCustomerValueUsd: z.number(),
  productCapabilityValueUsd: z.number(),
  distributionValueUsd: z.number(),
  strategicOptionValueUsd: z.number(),
  learningValueUsd: z.number(),
  brandValueUsd: z.number(),
  implementationCostUsd: z.number(),
  exclusivityOpportunityCostUsd: z.number(),
  concentrationLockInCostUsd: z.number(),
  exitCostUsd: z.number(),
  risks: z.array(riskItemSchema),
  confidenceFactorDims: confidenceFactorDimsSchema,
});

export const opportunitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  partnerAlias: z.string().min(1),
  archetype: archetypeSchema,
  stage: opportunityStageSchema,
  owner: z.string().min(1),
  createdAt: z.string().min(1),
  decisionDate: z.string().optional(),
  renewalDate: z.string().optional(),
  proposal: proposalTermsSchema,
  assumptions: z.array(assumptionSchema),
  selectedComparableIds: z.array(z.string()),
  scenarios: z.array(scenarioSchema),
  risks: z.array(riskItemSchema),
  recommendation: recommendationSchema.optional(),
  approvals: z.array(approvalSchema),
  auditEvents: z.array(auditEventSchema),
});
