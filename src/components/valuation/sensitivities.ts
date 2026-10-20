import type { ProposalTerms, ScenarioInput, ScenarioName } from "@/lib/domain/types";
import { computeValuation } from "@/lib/valuation/engine";
import {
  ASSUMPTION_VARIABLE_DEFS,
  type AssumptionVariableDef,
  type ConfidenceField,
  type ValueField,
} from "./assumption-model";

export interface Sensitivity {
  variable: string;
  baseValue: number;
  cavMinus10Usd: number;
  cavPlus10Usd: number;
  deltaAbsUsd: number;
}

const BASE_NAME: ScenarioName = "base";

function baseValueOf(inputs: ScenarioInput[], def: AssumptionVariableDef): number {
  const base = inputs.find((scenario) => scenario.name === BASE_NAME);
  if (!base) {
    return 0;
  }
  if (def.kind === "confidence") {
    return base.confidenceFactorDims[def.field as ConfidenceField];
  }
  return base[def.field as ValueField];
}

function withBasePerturbed(
  inputs: ScenarioInput[],
  def: AssumptionVariableDef,
  factor: number,
): ScenarioInput[] {
  const current = baseValueOf(inputs, def);
  const next =
    def.kind === "confidence"
      ? Math.min(1, Math.max(0.05, current * factor))
      : Math.max(0, current * factor);
  return inputs.map((scenario) => {
    if (scenario.name !== BASE_NAME) {
      return scenario;
    }
    const clone: ScenarioInput = {
      ...scenario,
      confidenceFactorDims: { ...scenario.confidenceFactorDims },
    };
    if (def.kind === "confidence") {
      clone.confidenceFactorDims[def.field as ConfidenceField] = next;
    } else {
      clone[def.field as ValueField] = next;
    }
    return clone;
  });
}

export function computeSensitivities(
  inputs: ScenarioInput[],
  proposal: ProposalTerms,
): Sensitivity[] {
  const seeded =
    computeValuation({ proposal, scenarios: inputs }).byName.base.confidenceAdjustedValueUsd;

  const results = ASSUMPTION_VARIABLE_DEFS.map((def) => {
    const minus = computeValuation({
      proposal,
      scenarios: withBasePerturbed(inputs, def, 0.9),
    }).byName.base.confidenceAdjustedValueUsd;
    const plus = computeValuation({
      proposal,
      scenarios: withBasePerturbed(inputs, def, 1.1),
    }).byName.base.confidenceAdjustedValueUsd;
    return {
      variable: def.variable,
      baseValue: baseValueOf(inputs, def),
      cavMinus10Usd: minus,
      cavPlus10Usd: plus,
      deltaAbsUsd: Math.max(Math.abs(minus - seeded), Math.abs(plus - seeded)),
    };
  });

  return results.sort((a, b) => b.deltaAbsUsd - a.deltaAbsUsd).slice(0, 5);
}
