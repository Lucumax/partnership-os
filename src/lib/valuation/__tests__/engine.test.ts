import { describe, expect, it } from "vitest";
import {
  computeComparability,
  computeRecommendation,
  computeScenario,
  computeValuation,
} from "@/lib/valuation/engine";
import {
  ATLAS_ANALYSIS_DATE,
  ATLAS_COMPARABILITY_TARGET,
  ATLAS_COMPARABLES,
  ATLAS_ECONOMICS,
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_RISKS,
  ATLAS_SCENARIO_INPUTS,
} from "@/lib/fixtures/atlas";
import { opportunitySchema, proposalTermsSchema, scenarioInputSchema } from "@/lib/domain/schemas";

describe("scenario recomputation", () => {
  it("changing an assumption changes the computed value", () => {
    const base = { ...ATLAS_SCENARIO_INPUTS[1] };
    const original = computeScenario(base, ATLAS_ECONOMICS).grossPartnershipValueUsd;
    const adjusted = computeScenario(
      { ...base, directFinancialValueUsd: base.directFinancialValueUsd + 10 },
      ATLAS_ECONOMICS,
    );
    expect(adjusted.grossPartnershipValueUsd).toBeCloseTo(original + 10, 9);
    expect(adjusted.grossPartnershipValueUsd).not.toBeCloseTo(original, 6);
  });

  it("NPV changes when the discount rate changes", () => {
    const valuation = computeValuation({ proposal: ATLAS_PROPOSAL, scenarios: ATLAS_SCENARIO_INPUTS });
    const atTen = computeValuation({
      proposal: ATLAS_PROPOSAL,
      scenarios: ATLAS_SCENARIO_INPUTS,
      discountRate: 0.1,
    });
    expect(atTen.npvCashCostUsd).toBeGreaterThan(valuation.npvCashCostUsd);
  });
});

describe("computeValuation", () => {
  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });

  it("returns all three scenarios", () => {
    expect(Object.keys(valuation.byName).sort()).toEqual(["base", "downside", "upside"]);
  });

  it("gaps equal CAV minus the 31.0 nominal cost", () => {
    for (const name of ["downside", "base", "upside"] as const) {
      expect(valuation.gapUsd[name]).toBeCloseTo(
        valuation.byName[name].confidenceAdjustedValueUsd - 31.0,
        9,
      );
    }
  });

  it("upside pays back within the term, base does not", () => {
    expect(valuation.byName.base.paybackMonths).toBeUndefined();
    expect(valuation.byName.upside.paybackMonths).toBeDefined();
    expect(valuation.byName.upside.paybackMonths).toBeGreaterThan(0);
    expect(valuation.byName.upside.paybackMonths).toBeLessThan(36);
  });
});

describe("computeRecommendation", () => {
  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });

  it("seeded case recommends a staged pilot with restructure rationale", () => {
    const recommendation = computeRecommendation({
      scenarios: valuation.byName,
      proposal: ATLAS_PROPOSAL,
      risks: ATLAS_RISKS,
      totalEconomicCostUsd: valuation.totalEconomicCostUsd,
      missingEvidence: [],
      changeConditions: [],
    });
    expect(recommendation.decision).toBe("pilot");
    expect(recommendation.preferredStructure.toLowerCase()).toContain("pilot");
    expect(recommendation.walkAwayValueUsd).toBeGreaterThan(recommendation.reservationValueUsd);
    expect(recommendation.generatedBy).toBe("ai_draft");
  });

  it("pursues once the base case clears the proposed cost", () => {
    const boostedBase = { ...valuation.byName.base, confidenceAdjustedValueUsd: 40.0 };
    const recommendation = computeRecommendation({
      scenarios: { ...valuation.byName, base: boostedBase },
      proposal: ATLAS_PROPOSAL,
      risks: ATLAS_RISKS,
      totalEconomicCostUsd: 31.0,
      missingEvidence: [],
      changeConditions: [],
    });
    expect(recommendation.decision).toBe("pursue");
  });
});

describe("computeComparability", () => {
  it("persists recencyDecayFactor on the returned comparable", () => {
    const pioneer = ATLAS_COMPARABLES.find((c) => c.id === "cmp-pioneer-hybrid-agreement");
    expect(pioneer).toBeDefined();
    const output = computeComparability(pioneer!, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
    expect(output.comparable.recencyDecayFactor).toBe(1);
    expect(output.adjustedScore).toBeCloseTo(output.rawScore, 9);
  });

  it("penalises a stale comparable", () => {
    const pioneer = ATLAS_COMPARABLES.find((c) => c.id === "cmp-pioneer-hybrid-agreement");
    expect(pioneer).toBeDefined();
    const stale = {
      ...pioneer!,
      id: "cmp-pioneer-stale",
      announcementDate: "2019-06-30T00:00:00Z",
    };
    const recent = computeComparability(pioneer!, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
    const staleResult = computeComparability(stale, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
    expect(staleResult.adjustedScore).toBeLessThan(recent.adjustedScore);
    expect(staleResult.recencyDecayFactor).toBeCloseTo(0.5, 6);
  });
});

describe("zod schema round-trips", () => {
  it("parses the seeded proposal, scenario inputs, and full opportunity", () => {
    expect(proposalTermsSchema.safeParse(ATLAS_PROPOSAL).success).toBe(true);
    for (const input of ATLAS_SCENARIO_INPUTS) {
      expect(scenarioInputSchema.safeParse(input).success).toBe(true);
    }
    expect(opportunitySchema.safeParse(ATLAS_OPPORTUNITY).success).toBe(true);
  });

  it("rejects an inconsistent cash schedule", () => {
    const bad = { ...ATLAS_PROPOSAL, cashConsiderationUsd: 99.0 };
    expect(proposalTermsSchema.safeParse(bad).success).toBe(false);
  });
});
