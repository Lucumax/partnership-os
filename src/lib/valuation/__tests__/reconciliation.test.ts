import { describe, expect, it } from "vitest";
import { computeValuation } from "@/lib/valuation/engine";
import { ATLAS_PROPOSAL, ATLAS_SCENARIO_INPUTS } from "@/lib/fixtures/atlas";

const TARGETS = {
  downside: { gpv: 14.0, cf: 0.55, cav: 7.7, gap: -23.3 },
  base: { gpv: 35.0, cf: 0.72, cav: 25.2, gap: -5.8 },
  upside: { gpv: 62.0, cf: 0.78, cav: 48.4, gap: 17.4 },
} as const;

type ScenarioName = keyof typeof TARGETS;

describe("seeded reconciliation (docs/VALUATION_RECONCILIATION.md)", () => {
  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });

  for (const name of Object.keys(TARGETS) as ScenarioName[]) {
    const target = TARGETS[name];
    const scenario = valuation.byName[name];

    it(`${name}: GPV reproduces ${target.gpv} (money +/- 0.05)`, () => {
      expect(scenario.grossPartnershipValueUsd).toBeCloseTo(target.gpv, 1);
    });

    it(`${name}: CF reproduces ${target.cf} (cf +/- 0.005)`, () => {
      expect(scenario.confidenceFactor).toBeCloseTo(target.cf, 3);
    });

    it(`${name}: CAV reproduces ${target.cav} (money +/- 0.05)`, () => {
      expect(scenario.confidenceAdjustedValueUsd).toBeCloseTo(target.cav, 1);
    });

    it(`${name}: gap reproduces ${target.gap} (money +/- 0.05)`, () => {
      expect(valuation.gapUsd[name]).toBeCloseTo(target.gap, 1);
    });
  }

  it("total economic cost is exactly 31.0 (4.0 upfront + 3 x (6.0 + 3.0))", () => {
    expect(valuation.totalEconomicCostUsd).toBeCloseTo(31.0, 6);
  });

  it("CF equals the equal-weight mean of the five stored dimensions", () => {
    for (const scenario of valuation.scenarios) {
      const dims = scenario.confidenceFactorDims;
      const mean =
        (dims.evidenceQuality +
          dims.assumptionStability +
          dims.comparableQuality +
          dims.implementationCertainty +
          dims.partnerExecutionConfidence) /
        5;
      expect(scenario.confidenceFactor).toBeCloseTo(mean, 9);
    }
  });

  it("CAV equals GPV times CF", () => {
    for (const scenario of valuation.scenarios) {
      expect(scenario.confidenceAdjustedValueUsd).toBeCloseTo(
        scenario.grossPartnershipValueUsd * scenario.confidenceFactor,
        6,
      );
    }
  });
});
