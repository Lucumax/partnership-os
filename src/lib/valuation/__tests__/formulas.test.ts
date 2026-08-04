import { describe, expect, it } from "vitest";
import {
  COMPARABILITY_WEIGHTS,
  comparabilityScore,
  confidenceFactor,
  expectedRiskCost,
  npvOfCashSchedule,
  recencyDecayFactor,
} from "@/lib/valuation/formulas";
import { computeScenario } from "@/lib/valuation/engine";
import {
  ATLAS_ANALYSIS_DATE,
  ATLAS_COMPARABILITY_TARGET,
  ATLAS_COMPARABLES,
  ATLAS_ECONOMICS,
  ATLAS_PROPOSAL,
  ATLAS_SCENARIO_INPUTS,
  RISK_BASE_ADOPTION,
  RISK_BASE_KEYPERSON,
  RISK_BASE_REGULATORY,
  RISK_DOWNSIDE_ADOPTION,
  RISK_DOWNSIDE_IMPLEMENTATION,
  RISK_UPSIDE_REGULATORY,
  RISK_UPSIDE_RENEWAL,
} from "@/lib/fixtures/atlas";
import type { ComparableTransaction } from "@/lib/domain/types";

describe("G-2 NPV of the contract cash side", () => {
  const npv = npvOfCashSchedule(ATLAS_PROPOSAL, 0.12);

  it("lies strictly between 24.0 and 28.0 at the default rate", () => {
    expect(npv).toBeGreaterThan(24.0);
    expect(npv).toBeLessThan(28.0);
  });

  it("is strictly below the 31.0 nominal cost", () => {
    expect(npv).toBeLessThan(31.0);
  });

  it("matches the published 25.62 value", () => {
    expect(npv).toBeCloseTo(25.62, 2);
  });

  it("is lower than the undiscounted nominal cost", () => {
    expect(npvOfCashSchedule(ATLAS_PROPOSAL, 0)).toBeCloseTo(31.0, 6);
    expect(npv).toBeLessThan(npvOfCashSchedule(ATLAS_PROPOSAL, 0));
  });
});

describe("ERC decomposition (P x impact)", () => {
  it("downside total is 1.5", () => {
    const erc = expectedRiskCost([RISK_DOWNSIDE_ADOPTION, RISK_DOWNSIDE_IMPLEMENTATION]);
    expect(erc).toBeCloseTo(1.5, 6);
    expect(RISK_DOWNSIDE_ADOPTION.probability * (RISK_DOWNSIDE_ADOPTION.impactUsd ?? 0)).toBeCloseTo(1.0, 6);
    expect(RISK_DOWNSIDE_IMPLEMENTATION.probability * (RISK_DOWNSIDE_IMPLEMENTATION.impactUsd ?? 0)).toBeCloseTo(0.5, 6);
  });

  it("base total is 2.0", () => {
    const erc = expectedRiskCost([RISK_BASE_ADOPTION, RISK_BASE_REGULATORY, RISK_BASE_KEYPERSON]);
    expect(erc).toBeCloseTo(2.0, 6);
    expect(RISK_BASE_REGULATORY.probability * (RISK_BASE_REGULATORY.impactUsd ?? 0)).toBeCloseTo(0.6, 6);
  });

  it("upside total is 1.5", () => {
    const erc = expectedRiskCost([RISK_UPSIDE_REGULATORY, RISK_UPSIDE_RENEWAL]);
    expect(erc).toBeCloseTo(1.5, 6);
    expect(RISK_UPSIDE_REGULATORY.probability * (RISK_UPSIDE_REGULATORY.impactUsd ?? 0)).toBeCloseTo(0.75, 6);
    expect(RISK_UPSIDE_RENEWAL.probability * (RISK_UPSIDE_RENEWAL.impactUsd ?? 0)).toBeCloseTo(0.75, 6);
  });
});

describe("confidence factor", () => {
  it("reproduces each seeded CF from the five stored dimensions", () => {
    const expected = { downside: 0.55, base: 0.72, upside: 0.78 } as const;
    for (const input of ATLAS_SCENARIO_INPUTS) {
      expect(confidenceFactor(input.confidenceFactorDims)).toBeCloseTo(expected[input.name], 3);
    }
  });
});

describe("ROI", () => {
  it("base case ROI is negative (CAV below proposed cost)", () => {
    const base = computeScenario(ATLAS_SCENARIO_INPUTS[1], ATLAS_ECONOMICS);
    expect(base.roi).toBeLessThan(0);
  });

  it("matches the hand-computed base ROI", () => {
    const base = computeScenario(ATLAS_SCENARIO_INPUTS[1], ATLAS_ECONOMICS);
    const expected = (25.2 - 31.0 - 1.5) / (31.0 + 1.5);
    expect(base.roi).toBeCloseTo(expected, 6);
  });
});

describe("comparability score weights", () => {
  it("weights sum to 1", () => {
    const total = Object.values(COMPARABILITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it("rawScore equals the weighted sum of the dimension scores", () => {
    for (const comparable of ATLAS_COMPARABLES) {
      const result = comparabilityScore(comparable, ATLAS_COMPARABILITY_TARGET, ATLAS_ANALYSIS_DATE);
      const weightedSum = result.dimensions.reduce((sum, dimension) => sum + dimension.weighted, 0);
      expect(result.rawScore).toBeCloseTo(weightedSum, 9);
      for (const dimension of result.dimensions) {
        expect(dimension.weighted).toBeCloseTo(dimension.weight * dimension.score, 9);
      }
    }
  });

  it("Pioneer (identical structure) scores higher than Northstar (no distribution)", () => {
    const pioneer = ATLAS_COMPARABLES.find((c) => c.id === "cmp-pioneer-hybrid-agreement");
    const northstar = ATLAS_COMPARABLES.find((c) => c.id === "cmp-northstar-data-license");
    expect(pioneer).toBeDefined();
    expect(northstar).toBeDefined();
    expect(pioneer!.comparabilityScore).toBeGreaterThan(northstar!.comparabilityScore);
  });
});

describe("G-15 recency decay", () => {
  const analysisDate = ATLAS_ANALYSIS_DATE;

  function comparableWithDate(date: string): ComparableTransaction {
    return {
      ...ATLAS_COMPARABLES[0],
      id: `cmp-recency-${date}`,
      announcementDate: date,
      comparabilityScore: 0,
    };
  }

  it("applies no decay within 24 months", () => {
    expect(recencyDecayFactor("2024-06-12T00:00:00Z", analysisDate)).toBe(1);
  });

  it("decays stale comparables and floors at 0.5", () => {
    expect(recencyDecayFactor("2019-06-30T00:00:00Z", analysisDate)).toBeCloseTo(0.5, 6);
  });

  it("a stale comparable scores strictly lower than an identical recent one", () => {
    const recent = comparabilityScore(comparableWithDate("2024-06-12T00:00:00Z"), ATLAS_COMPARABILITY_TARGET, analysisDate);
    const stale = comparabilityScore(comparableWithDate("2019-06-30T00:00:00Z"), ATLAS_COMPARABILITY_TARGET, analysisDate);
    expect(stale.rawScore).toBeCloseTo(recent.rawScore, 9);
    expect(stale.adjustedScore).toBeLessThan(recent.adjustedScore);
  });
});
