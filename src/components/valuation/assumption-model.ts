import type {
  Confidence,
  ConfidenceFactorDims,
  ScenarioInput,
  ScenarioName,
} from "@/lib/domain/types";

export const SCENARIO_NAMES: readonly ScenarioName[] = ["downside", "base", "upside"];

export type ValueField =
  | "directFinancialValueUsd"
  | "usageCustomerValueUsd"
  | "productCapabilityValueUsd"
  | "distributionValueUsd"
  | "strategicOptionValueUsd"
  | "learningValueUsd"
  | "brandValueUsd"
  | "implementationCostUsd"
  | "exclusivityOpportunityCostUsd"
  | "concentrationLockInCostUsd"
  | "exitCostUsd";

export type ConfidenceField = keyof ConfidenceFactorDims;

export type VariableKind = "value" | "cost" | "confidence";

export interface AssumptionVariableDef {
  field: ValueField | ConfidenceField;
  variable: string;
  kind: VariableKind;
  evidence: string;
  confidence: Confidence;
  owner: string;
  lastUpdatedAt: string;
}

export interface AssumptionRow {
  id: string;
  variable: string;
  kind: VariableKind;
  evidence: string;
  confidence: Confidence;
  owner: string;
  lastUpdatedAt: string;
  downside: string;
  base: string;
  upside: string;
}

const VALUE_DEFS: AssumptionVariableDef[] = [
  {
    field: "directFinancialValueUsd",
    variable: "Direct financial value",
    kind: "value",
    evidence: "Term sheet economics: upfront + annual license",
    confidence: "medium",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-12",
  },
  {
    field: "usageCustomerValueUsd",
    variable: "Usage & customer value",
    kind: "value",
    evidence: "Usage ramp from discovery calls (adoption plan)",
    confidence: "medium",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-12",
  },
  {
    field: "productCapabilityValueUsd",
    variable: "Product capability value",
    kind: "value",
    evidence: "Product integration roadmap estimate",
    confidence: "medium",
    owner: "delivery.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "distributionValueUsd",
    variable: "Enterprise distribution value",
    kind: "value",
    evidence: "Distribution upside un-evidenced (seed assumption)",
    confidence: "low",
    owner: "strategy.ops.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "strategicOptionValueUsd",
    variable: "Strategic option value",
    kind: "value",
    evidence: "Option value from category access",
    confidence: "low",
    owner: "strategy.ops.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "learningValueUsd",
    variable: "Learning value",
    kind: "value",
    evidence: "Model-training feedback loop",
    confidence: "low",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "brandValueUsd",
    variable: "Brand / ecosystem value",
    kind: "value",
    evidence: "Brand halo effect (G-11)",
    confidence: "low",
    owner: "strategy.ops.lead",
    lastUpdatedAt: "2025-06-01",
  },
];

const COST_DEFS: AssumptionVariableDef[] = [
  {
    field: "implementationCostUsd",
    variable: "Implementation cost",
    kind: "cost",
    evidence: "Implementation support $1.5M equivalent",
    confidence: "medium",
    owner: "delivery.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "exclusivityOpportunityCostUsd",
    variable: "Exclusivity opportunity cost",
    kind: "cost",
    evidence: "Limited category exclusivity (G-1 rights)",
    confidence: "medium",
    owner: "legal.reviewer",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "concentrationLockInCostUsd",
    variable: "Concentration / lock-in cost",
    kind: "cost",
    evidence: "Supplier concentration exposure",
    confidence: "medium",
    owner: "strategy.ops.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "exitCostUsd",
    variable: "Exit / break-up cost",
    kind: "cost",
    evidence: "Convenience-after-year-two termination fee (G-4)",
    confidence: "medium",
    owner: "legal.reviewer",
    lastUpdatedAt: "2025-06-01",
  },
];

const CONFIDENCE_DEFS: AssumptionVariableDef[] = [
  {
    field: "evidenceQuality",
    variable: "Evidence quality",
    kind: "confidence",
    evidence: "Quality and recency of supporting evidence",
    confidence: "medium",
    owner: "research.stakeholder",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "assumptionStability",
    variable: "Assumption stability",
    kind: "confidence",
    evidence: "Volatility of underlying assumptions",
    confidence: "medium",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "comparableQuality",
    variable: "Comparable quality",
    kind: "confidence",
    evidence: "Fit of comparable library and recency",
    confidence: "medium",
    owner: "research.stakeholder",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "implementationCertainty",
    variable: "Implementation certainty",
    kind: "confidence",
    evidence: "Delivery confidence and track record",
    confidence: "medium",
    owner: "delivery.lead",
    lastUpdatedAt: "2025-06-01",
  },
  {
    field: "partnerExecutionConfidence",
    variable: "Partner execution confidence",
    kind: "confidence",
    evidence: "Partner delivery and ops maturity",
    confidence: "medium",
    owner: "deal.lead",
    lastUpdatedAt: "2025-06-01",
  },
];

export const ASSUMPTION_VARIABLE_DEFS: AssumptionVariableDef[] = [
  ...VALUE_DEFS,
  ...COST_DEFS,
  ...CONFIDENCE_DEFS,
];

function findScenario(inputs: ScenarioInput[], name: ScenarioName): ScenarioInput | undefined {
  return inputs.find((scenario) => scenario.name === name);
}

function readValue(inputs: ScenarioInput[], name: ScenarioName, def: AssumptionVariableDef): number {
  const scenario = findScenario(inputs, name);
  if (!scenario) {
    return 0;
  }
  if (def.kind === "confidence") {
    return scenario.confidenceFactorDims[def.field as ConfidenceField];
  }
  return scenario[def.field as ValueField];
}

export function buildAssumptionRows(inputs: ScenarioInput[]): AssumptionRow[] {
  return ASSUMPTION_VARIABLE_DEFS.map((def) => ({
    id: def.field,
    variable: def.variable,
    kind: def.kind,
    evidence: def.evidence,
    confidence: def.confidence,
    owner: def.owner,
    lastUpdatedAt: def.lastUpdatedAt,
    downside: String(readValue(inputs, "downside", def)),
    base: String(readValue(inputs, "base", def)),
    upside: String(readValue(inputs, "upside", def)),
  }));
}

export function scenarioInputsFromRows(
  rows: AssumptionRow[],
  source: ScenarioInput[],
): ScenarioInput[] {
  const next = source.map((scenario) => ({
    ...scenario,
    confidenceFactorDims: { ...scenario.confidenceFactorDims },
  }));

  for (const row of rows) {
    const parse = (raw: string) => {
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : 0;
    };
    const values: Record<ScenarioName, number> = {
      downside: parse(row.downside),
      base: parse(row.base),
      upside: parse(row.upside),
    };
    for (const name of SCENARIO_NAMES) {
      const scenario = findScenario(next, name);
      if (!scenario) {
        continue;
      }
      if (row.kind === "confidence") {
        scenario.confidenceFactorDims[row.id as ConfidenceField] = values[name];
      } else {
        scenario[row.id as ValueField] = values[name];
      }
    }
  }

  return next;
}
