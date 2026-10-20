import { describe, expect, it } from "vitest";

import { deriveGiveGetRows } from "@/lib/negotiation/derive";
import { computeValuation } from "@/lib/valuation/engine";
import { DEFAULT_DISCOUNT_RATE, npvOfCashSchedule, presentValue } from "@/lib/valuation/formulas";
import { ATLAS_PROPOSAL, ATLAS_RECOMMENDATION, ATLAS_SCENARIO_INPUTS } from "@/lib/fixtures/atlas";

describe("deriveGiveGetRows", () => {
  const valuation = computeValuation({
    proposal: ATLAS_PROPOSAL,
    scenarios: ATLAS_SCENARIO_INPUTS,
  });
  const rows = deriveGiveGetRows(
    ATLAS_RECOMMENDATION.giveGetOptions,
    valuation.byName.base,
    ATLAS_PROPOSAL,
  );

  it("returns one row per give/get option", () => {
    expect(rows).toHaveLength(ATLAS_RECOMMENDATION.giveGetOptions.length);
  });

  it("does not use a rotating constant-times-headroom formula (the original bug)", () => {
    const headroom =
      valuation.byName.upside.confidenceAdjustedValueUsd - valuation.byName.base.confidenceAdjustedValueUsd;
    const oldFactors = [0.15, 0.25, 0.3];
    const oldSigns = [-1, 1, 1];
    rows.forEach((row, index) => {
      const oldValue =
        oldSigns[index % oldSigns.length] *
        Math.round(headroom * oldFactors[index % oldFactors.length] * 10) / 10;
      expect(row.economicImpactUsd).not.toBeCloseTo(oldValue, 3);
    });
  });

  it("every row is grounded in a real, traceable input and labeled as a ceiling", () => {
    for (const row of rows) {
      expect(row.economicImpactBasis).toBe("ceiling");
      expect(row.economicImpactUsd).toBeGreaterThanOrEqual(0);
      // The honest-precision caveat must be visible in the text the UI actually renders.
      expect(row.strategicImpact.toLowerCase()).toContain("ceiling");
    }
  });

  it("row 0 (usage commitment / license fee) is the NPV of the full annual license fee", () => {
    const years = ATLAS_PROPOSAL.termMonths / 12;
    let expected = 0;
    for (let year = 1; year <= years; year += 1) {
      expected += presentValue(ATLAS_PROPOSAL.annualLicenseFeeUsd, year, DEFAULT_DISCOUNT_RATE);
    }
    expect(rows[0].economicImpactUsd).toBeCloseTo(Math.round(expected * 10) / 10, 6);
  });

  it("row 1 (exclusivity / implementation support) is the confidence-adjusted value of the matching base-case cost lines", () => {
    const base = valuation.byName.base;
    const expected =
      Math.round((base.exclusivityOpportunityCostUsd + base.implementationCostUsd) * base.confidenceFactor * 10) /
      10;
    expect(rows[1].economicImpactUsd).toBeCloseTo(expected, 6);
  });

  it("row 2 (pilot / renewal) is the NPV cash deferred by stopping at a 12-month pilot", () => {
    const fullTermNpv = npvOfCashSchedule(ATLAS_PROPOSAL, DEFAULT_DISCOUNT_RATE);
    const pilotNpv = npvOfCashSchedule({ ...ATLAS_PROPOSAL, termMonths: 12 }, DEFAULT_DISCOUNT_RATE);
    const expected = Math.round((fullTermNpv - pilotNpv) * 10) / 10;
    expect(rows[2].economicImpactUsd).toBeCloseTo(expected, 6);
    expect(rows[2].economicImpactUsd).toBeGreaterThan(0);
  });
});
