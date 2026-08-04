import { PARTNERSHIP_ARCHETYPES } from "@/lib/fixtures";
import type {
  Archetype,
  AssumptionCategory,
  Decision,
  Exclusivity,
  OpportunityStage,
  RiskCategory,
  ScenarioName,
  Severity,
} from "@/lib/domain/types";

export const STAGE_LABELS: Record<OpportunityStage, string> = {
  inbound: "Inbound",
  diligence: "Diligence",
  valuation: "Valuation",
  negotiation: "Negotiation",
  approval: "Approval",
  contracting: "Contracting",
  active: "Active",
  declined: "Declined",
};

export function stageLabel(stage: OpportunityStage): string {
  return STAGE_LABELS[stage];
}

export function archetypeLabel(id: Archetype): string {
  return PARTNERSHIP_ARCHETYPES.find((archetype) => archetype.id === id)?.label ?? id;
}

export const SCENARIO_LABELS: Record<ScenarioName, string> = {
  downside: "Downside",
  base: "Base",
  upside: "Upside",
};

export function scenarioLabel(name: ScenarioName): string {
  return SCENARIO_LABELS[name];
}

export const DECISION_LABELS: Record<Decision, string> = {
  pursue: "Pursue",
  pilot: "Pilot",
  restructure: "Restructure",
  decline: "Decline",
  defer: "Defer",
};

export function decisionLabel(decision: Decision): string {
  return DECISION_LABELS[decision];
}

export const EXCLUSIVITY_LABELS: Record<Exclusivity, string> = {
  none: "None",
  limited: "Limited",
  category: "Category",
  full: "Full",
};

export function exclusivityLabel(value: Exclusivity): string {
  return EXCLUSIVITY_LABELS[value];
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  commercial: "Commercial",
  legal: "Legal",
  privacy: "Privacy",
  safety: "Safety",
  reputational: "Reputational",
  technical: "Technical",
  operational: "Operational",
  concentration: "Concentration",
  regulatory: "Regulatory",
};

export function riskCategoryLabel(value: RiskCategory): string {
  return RISK_CATEGORY_LABELS[value];
}

export const ASSUMPTION_CATEGORY_LABELS: Record<AssumptionCategory, string> = {
  usage: "Usage",
  revenue: "Revenue",
  cost: "Cost",
  timing: "Timing",
  risk: "Risk",
  renewal: "Renewal",
  strategic: "Strategic",
  other: "Other",
};
