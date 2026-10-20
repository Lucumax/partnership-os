import { describe, expect, it } from "vitest";
import {
  ATLAS_ANALYSIS_DATE,
  ATLAS_PORTFOLIO_ENTRY,
  PORTFOLIO_ENTRIES,
} from "@/lib/fixtures";
import type { PortfolioEntry } from "@/lib/fixtures";
import { monthsBetween } from "@/lib/valuation/formulas";

const ANALYSIS_DATE = ATLAS_ANALYSIS_DATE;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(monthsBetween(fromIso, toIso) * 30.4375);
}

describe("portfolio fixtures", () => {
  it("holds ten cases with Atlas as the only fully modeled one", () => {
    expect(PORTFOLIO_ENTRIES).toHaveLength(10);
    const modeled = PORTFOLIO_ENTRIES.filter((entry) => entry.modeled);
    expect(modeled).toHaveLength(1);
    expect(modeled[0]).toBe(ATLAS_PORTFOLIO_ENTRY);
    expect(ATLAS_PORTFOLIO_ENTRY.href).toBe("/opportunities/atlas");
  });

  it("derives the Atlas entry from the engine (35.0 GPV, 25.2 CAV, 31.0 cost)", () => {
    expect(ATLAS_PORTFOLIO_ENTRY.grossValueUsd).toBeCloseTo(35.0, 1);
    expect(ATLAS_PORTFOLIO_ENTRY.confidenceAdjustedValueUsd).toBeCloseTo(25.2, 1);
    expect(ATLAS_PORTFOLIO_ENTRY.economicCostUsd).toBeCloseTo(31.0, 6);
    expect(ATLAS_PORTFOLIO_ENTRY.highRisk).toBe(true);
  });

  it("gives every non-modeled entry no href (no drill-through depth implied)", () => {
    for (const entry of PORTFOLIO_ENTRIES) {
      if (entry.modeled) {
        continue;
      }
      expect(entry.href).toBeUndefined();
    }
  });

  it("keeps CAV below gross for every entry (CAV is risk-discounted)", () => {
    for (const entry of PORTFOLIO_ENTRIES) {
      expect(entry.confidenceAdjustedValueUsd).toBeLessThan(entry.grossValueUsd);
    }
  });

  it("lands at least two decision dates 8–25 days after the analysis date", () => {
    const nearDecisions = PORTFOLIO_ENTRIES.filter((entry) => {
      if (!entry.decisionDate) {
        return false;
      }
      const days = daysBetween(ANALYSIS_DATE, entry.decisionDate);
      return days >= 8 && days <= 25;
    });
    expect(nearDecisions.length).toBeGreaterThanOrEqual(2);
  });

  it("reports at least one clearly positive and one clearly negative gap", () => {
    const gaps = PORTFOLIO_ENTRIES.map(
      (entry) => entry.confidenceAdjustedValueUsd - entry.economicCostUsd,
    );
    expect(gaps.some((gap) => gap >= 5)).toBe(true);
    expect(gaps.some((gap) => gap <= -5)).toBe(true);
  });
});

describe("portfolio aggregation (regression guard for the reduce-iteratee bug)", () => {
  function sumBy(entries: PortfolioEntry[], pick: (entry: PortfolioEntry) => number): number {
    return entries.reduce((sum, entry) => sum + pick(entry), 0);
  }

  it("pipeline value equals the SUM of entry gross values — not N × Atlas", () => {
    const total = sumBy(PORTFOLIO_ENTRIES, (entry) => entry.grossValueUsd);
    expect(total).toBeCloseTo(193.0, 6);
    expect(total).not.toBeCloseTo(
      PORTFOLIO_ENTRIES.length * ATLAS_PORTFOLIO_ENTRY.grossValueUsd,
      6,
    );
  });

  it("confidence-adjusted value equals the SUM of entry CAVs — not N × Atlas", () => {
    const total = sumBy(PORTFOLIO_ENTRIES, (entry) => entry.confidenceAdjustedValueUsd);
    expect(total).toBeCloseTo(120.2, 6);
    expect(total).not.toBeCloseTo(
      PORTFOLIO_ENTRIES.length * ATLAS_PORTFOLIO_ENTRY.confidenceAdjustedValueUsd,
      6,
    );
  });

  it("proposed spend equals the SUM of entry costs — not N × Atlas", () => {
    const total = sumBy(PORTFOLIO_ENTRIES, (entry) => entry.economicCostUsd);
    expect(total).toBeCloseTo(111.5, 6);
    expect(total).not.toBeCloseTo(
      PORTFOLIO_ENTRIES.length * ATLAS_PORTFOLIO_ENTRY.economicCostUsd,
      6,
    );
  });

  it("funnel counts sum to the number of entries (10)", () => {
    const stages = [...new Set(PORTFOLIO_ENTRIES.map((entry) => entry.stage))];
    const count = stages.reduce(
      (sum, stage) => sum + PORTFOLIO_ENTRIES.filter((entry) => entry.stage === stage).length,
      0,
    );
    expect(count).toBe(10);
  });

  it("pipeline holds more cases in inbound than in any later stage (thinning shape)", () => {
    const countByStage = new Map<string, number>();
    for (const entry of PORTFOLIO_ENTRIES) {
      countByStage.set(entry.stage, (countByStage.get(entry.stage) ?? 0) + 1);
    }
    const inboundCount = countByStage.get("inbound") ?? 0;
    const laterStages = ["negotiation", "approval", "contracting"] as const;
    for (const stage of laterStages) {
      expect(inboundCount).toBeGreaterThan(countByStage.get(stage) ?? 0);
    }
  });

  it("lets a single negotiation-stage case outweigh the inbound stage on CAV", () => {
    const cavByStage = new Map<string, number>();
    for (const entry of PORTFOLIO_ENTRIES) {
      cavByStage.set(
        entry.stage,
        (cavByStage.get(entry.stage) ?? 0) + entry.confidenceAdjustedValueUsd,
      );
    }
    expect(cavByStage.get("negotiation") ?? 0).toBeGreaterThan(cavByStage.get("inbound") ?? 0);
  });

  it("concentration shares sum to ~100% of portfolio CAV", () => {
    const archetypes = [...new Set(PORTFOLIO_ENTRIES.map((entry) => entry.archetype))];
    const byArchetype = archetypes.map((archetype) =>
      sumBy(
        PORTFOLIO_ENTRIES.filter((entry) => entry.archetype === archetype),
        (entry) => entry.confidenceAdjustedValueUsd,
      ),
    );
    const shareSum =
      byArchetype.reduce((sum, value) => sum + value, 0) /
      sumBy(PORTFOLIO_ENTRIES, (entry) => entry.confidenceAdjustedValueUsd);
    expect(shareSum).toBeCloseTo(1, 9);
  });

  it("scatter has points on BOTH sides of the break-even line", () => {
    const gaps = PORTFOLIO_ENTRIES.map(
      (entry) => entry.confidenceAdjustedValueUsd - entry.economicCostUsd,
    );
    expect(gaps.some((gap) => gap > 0)).toBe(true);
    expect(gaps.some((gap) => gap < 0)).toBe(true);
  });
});
