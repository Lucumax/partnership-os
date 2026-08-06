import { describe, expect, it } from "vitest";
import {
  computeComparability,
  computeRecommendation,
  computeScenario,
  computeValuation,
} from "@/lib/valuation/engine";
import { DEFAULT_DISCOUNT_RATE, npvOfCashSchedule } from "@/lib/valuation/formulas";
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
    expect(recommendation.generatedBy).toBe("ai_draft");
  });

  it("negotiation ladder is ordered as positions on price: opening < target < reservation <= walk-away", () => {
    const recommendation = computeRecommendation({
      scenarios: valuation.byName,
      proposal: ATLAS_PROPOSAL,
      risks: ATLAS_RISKS,
      totalEconomicCostUsd: valuation.totalEconomicCostUsd,
      missingEvidence: [],
      changeConditions: [],
    });
    expect(recommendation.openingPositionUsd).toBeLessThan(recommendation.targetValueUsd);
    expect(recommendation.targetValueUsd).toBeLessThan(recommendation.reservationValueUsd);
    expect(recommendation.reservationValueUsd).toBeLessThanOrEqual(recommendation.walkAwayValueUsd);
  });

  it("anchors opening/reservation/target to scenario CAVs rather than a fabricated split", () => {
    const recommendation = computeRecommendation({
      scenarios: valuation.byName,
      proposal: ATLAS_PROPOSAL,
      risks: ATLAS_RISKS,
      totalEconomicCostUsd: valuation.totalEconomicCostUsd,
      missingEvidence: [],
      changeConditions: [],
    });
    expect(recommendation.openingPositionUsd).toBeCloseTo(
      valuation.byName.downside.confidenceAdjustedValueUsd,
      9,
    );
    expect(recommendation.reservationValueUsd).toBeCloseTo(
      valuation.byName.base.confidenceAdjustedValueUsd,
      9,
    );
    expect(recommendation.targetValueUsd).toBeCloseTo(
      (recommendation.openingPositionUsd + recommendation.reservationValueUsd) / 2,
      9,
    );
    // Regression guard for the original bug: walk-away must not simply be the upside CAV (which
    // made "walk away" the largest number in the ladder, for exactly the wrong reason).
    expect(recommendation.walkAwayValueUsd).not.toBeCloseTo(
      valuation.byName.upside.confidenceAdjustedValueUsd,
      1,
    );
  });

  it("derives the walk-away threshold from the reservation ceiling via the proposal's own nominal/NPV ratio", () => {
    const recommendation = computeRecommendation({
      scenarios: valuation.byName,
      proposal: ATLAS_PROPOSAL,
      risks: ATLAS_RISKS,
      totalEconomicCostUsd: valuation.totalEconomicCostUsd,
      missingEvidence: [],
      changeConditions: [],
    });
    const npv = npvOfCashSchedule(ATLAS_PROPOSAL, DEFAULT_DISCOUNT_RATE);
    const expectedWalkAway = recommendation.reservationValueUsd * (valuation.totalEconomicCostUsd / npv);
    expect(recommendation.walkAwayValueUsd).toBeCloseTo(expectedWalkAway, 6);
    // Sanity check against the reconciled NPV figure (~25.62M on a 31.0M nominal ask).
    expect(npv).toBeGreaterThan(24.0);
    expect(npv).toBeLessThan(27.0);
  });

  it("reservation value tracks the value we underwrite, not the size of the counterparty's ask", () => {
    const recommendation = computeRecommendation({
      scenarios: valuation.byName,
      proposal: ATLAS_PROPOSAL,
      risks: ATLAS_RISKS,
      totalEconomicCostUsd: 1000, // an implausibly large ask should not move what we'd pay
      missingEvidence: [],
      changeConditions: [],
    });
    expect(recommendation.reservationValueUsd).toBeCloseTo(
      valuation.byName.base.confidenceAdjustedValueUsd,
      9,
    );
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
    expect(recommendation.reservationValueUsd).toBe(40.0);
    expect(recommendation.openingPositionUsd).toBeLessThan(recommendation.targetValueUsd);
    expect(recommendation.targetValueUsd).toBeLessThan(recommendation.reservationValueUsd);
    expect(recommendation.reservationValueUsd).toBeLessThanOrEqual(recommendation.walkAwayValueUsd);
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
      announcementDate: "2020-07-30T00:00:00Z",
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
