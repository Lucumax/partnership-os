import type {
  AiUseRight,
  Archetype,
  Confidence,
  Exclusivity,
  RegulatoryFlag,
  RegulatoryFlagStatus,
  RiskCategory,
  Severity,
  SourceType,
} from "@/lib/domain/types";

export function fmtMoney(value: number): string {
  return `$${value.toFixed(1)}M`;
}

export function fmtMoneyPrecise(value: number): string {
  return `$${value.toFixed(2)}M`;
}

export function fmtSignedMoney(value: number): string {
  const abs = Math.abs(value).toFixed(1);
  return value >= 0 ? `+$${abs}M` : `−$${abs}M`;
}

export function fmtNumber(value: number): string {
  return value.toFixed(1);
}

export function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtScore(value: number): string {
  return value.toFixed(2);
}

export function fmtPayback(months: number | undefined): string {
  if (months === undefined || months === null || Number.isNaN(months)) {
    return "n/a";
  }
  return `${months.toFixed(1)} mo`;
}

export function fmtDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toISOString().slice(0, 10);
}

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  data_licensing: "Data Licensing",
  product_integration: "Product Integration",
  distribution: "Distribution",
  strategic_ecosystem: "Strategic Ecosystem",
  hybrid: "Hybrid",
};

export const EXCLUSIVITY_LABELS: Record<Exclusivity, string> = {
  none: "None",
  limited: "Limited",
  category: "Category",
  full: "Full",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  synthetic: "Synthetic",
  public: "Public",
  internal: "Internal",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
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

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const AI_USE_LABELS: Record<AiUseRight, string> = {
  training: "Training",
  inference: "Inference",
  outputs: "Outputs",
  model_weights: "Model weights",
  feedback_data: "Feedback data",
  derivative_works: "Derivative works",
};

export const REGULATORY_FLAG_LABELS: Record<RegulatoryFlag, string> = {
  hsr_merger_control: "HSR / merger control",
  exclusivity_preferential_access: "Exclusivity / preferential access",
  ai_act: "EU AI Act",
  data_export: "Data export",
  foreign_investment: "Foreign investment",
  responsible_scaling: "Responsible scaling",
};

export const REGULATORY_FLAG_KEYS = Object.keys(REGULATORY_FLAG_LABELS) as RegulatoryFlag[];

export const REGULATORY_FLAG_STATUS_LABELS: Record<RegulatoryFlagStatus, string> = {
  open: "Open",
  not_applicable: "N/A",
  flagged: "Flagged",
};
