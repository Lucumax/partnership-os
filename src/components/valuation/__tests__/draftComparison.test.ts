import { describe, expect, it } from "vitest";

import { ATLAS_PROPOSAL, ATLAS_SCENARIO_INPUTS } from "@/lib/fixtures";
import { computeValuation } from "@/lib/valuation/engine";

// Regression coverage for the behaviour the proposal page's draft comparison panel
// (src/components/valuation/draft-comparison.tsx) relies on: feeding an edited draft
// ProposalTerms through the same computeValuation engine used by the valuation screen,
// without ever mutating or persisting over the seeded ATLAS_PROPOSAL fixture.
describe("draft proposal recompute (proposal page comparison panel)", () => {
  const seeded = computeValuation({ proposal: ATLAS_PROPOSAL, scenarios: ATLAS_SCENARIO_INPUTS });

  it("does not mutate the seeded ATLAS_PROPOSAL fixture", () => {
    const before = JSON.stringify(ATLAS_PROPOSAL);
    const draft = { ...ATLAS_PROPOSAL, annualLicenseFeeUsd: 500.0 };
    computeValuation({ proposal: draft, scenarios: ATLAS_SCENARIO_INPUTS });
    expect(JSON.stringify(ATLAS_PROPOSAL)).toBe(before);
  });

  it("reproduces the reported repro: raising the annual license fee to $500M moves NPV cash cost but leaves nominal cost and gap untouched", () => {
    // This is the exact edit an independent reviewer made that exposed the original defect:
    // the proposal page's own nominal total reacted, but every other figure the engine
    // exposes (nominal cash cost, gap, GPV, CAV) is driven by cashConsiderationUsd and the
    // scenario assumptions, not by annualLicenseFeeUsd alone.
    const draft = { ...ATLAS_PROPOSAL, annualLicenseFeeUsd: 500.0 };
    const draftValuation = computeValuation({ proposal: draft, scenarios: ATLAS_SCENARIO_INPUTS });

    expect(draftValuation.npvCashCostUsd).toBeGreaterThan(seeded.npvCashCostUsd * 10);
    expect(draftValuation.nominalCashCostUsd).toBeCloseTo(seeded.nominalCashCostUsd, 9);
    for (const name of ["downside", "base", "upside"] as const) {
      expect(draftValuation.gapUsd[name]).toBeCloseTo(seeded.gapUsd[name], 9);
      expect(draftValuation.byName[name].grossPartnershipValueUsd).toBeCloseTo(
        seeded.byName[name].grossPartnershipValueUsd,
        9,
      );
      expect(draftValuation.byName[name].confidenceAdjustedValueUsd).toBeCloseTo(
        seeded.byName[name].confidenceAdjustedValueUsd,
        9,
      );
    }
  });

  it("editing cash consideration moves the nominal cost and every scenario gap, but not GPV/CAV", () => {
    const draft = { ...ATLAS_PROPOSAL, cashConsiderationUsd: 50.0 };
    const draftValuation = computeValuation({ proposal: draft, scenarios: ATLAS_SCENARIO_INPUTS });

    expect(draftValuation.nominalCashCostUsd).toBeCloseTo(50.0, 9);
    expect(draftValuation.nominalCashCostUsd).not.toBeCloseTo(seeded.nominalCashCostUsd, 6);

    for (const name of ["downside", "base", "upside"] as const) {
      expect(draftValuation.gapUsd[name]).toBeCloseTo(
        draftValuation.byName[name].confidenceAdjustedValueUsd - 50.0,
        9,
      );
      expect(draftValuation.gapUsd[name]).not.toBeCloseTo(seeded.gapUsd[name], 3);
      expect(draftValuation.byName[name].grossPartnershipValueUsd).toBeCloseTo(
        seeded.byName[name].grossPartnershipValueUsd,
        9,
      );
    }
  });

  it("the seeded reconciliation figures are unaffected by exercising the draft path", () => {
    expect(seeded.byName.downside.grossPartnershipValueUsd).toBeCloseTo(14.0, 1);
    expect(seeded.byName.base.grossPartnershipValueUsd).toBeCloseTo(35.0, 1);
    expect(seeded.byName.upside.grossPartnershipValueUsd).toBeCloseTo(62.0, 1);
    expect(seeded.byName.downside.confidenceAdjustedValueUsd).toBeCloseTo(7.7, 1);
    expect(seeded.byName.base.confidenceAdjustedValueUsd).toBeCloseTo(25.2, 1);
    expect(seeded.byName.upside.confidenceAdjustedValueUsd).toBeCloseTo(48.4, 1);
  });
});
