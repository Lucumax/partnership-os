import { describe, expect, it } from "vitest";

import {
  ATLAS_COMPARABLES,
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_RECOMMENDATION,
  ATLAS_SCENARIO_INPUTS,
} from "@/lib/fixtures";
import { computeValuation } from "@/lib/valuation/engine";
import { toCsv, toJson, toMarkdown } from "@/lib/export";

const valuation = computeValuation({
  proposal: ATLAS_PROPOSAL,
  scenarios: ATLAS_SCENARIO_INPUTS,
});

describe("toMarkdown", () => {
  const markdown = toMarkdown(ATLAS_OPPORTUNITY, valuation, ATLAS_RECOMMENDATION);

  it("contains the seeded base CAV and decision", () => {
    expect(markdown).toContain("$25.2M");
    expect(markdown).toContain("pilot");
    // Target is the midpoint of the opening anchor (downside CAV) and the reservation ceiling
    // (base CAV) -- not the old base/upside midpoint ($36.8M), which mixed a price position with
    // the unpriced upside case. See computeRecommendation in src/lib/valuation/engine.ts.
    expect(markdown).toContain("$16.4M");
    expect(markdown).toContain("$48.4M");
    expect(markdown).toContain("$7.7M");
  });

  it("reports the number of source comparables", () => {
    expect(markdown).toContain("5 comparables");
  });

  it("renders the give/get matrix with derived impact columns", () => {
    expect(markdown).toContain("Give / get matrix");
    expect(markdown).toContain("Economic impact");
    expect(markdown).toContain("We give");
  });
});

describe("toJson", () => {
  const json = toJson(ATLAS_OPPORTUNITY);
  const parsed = JSON.parse(json) as {
    exportedAt: string;
    case: typeof ATLAS_OPPORTUNITY;
  };

  it("serializes the full case and audit trail", () => {
    expect(parsed.case.id).toBe("atlas-opportunity-001");
    expect(parsed.case.auditEvents.length).toBeGreaterThanOrEqual(3);
    expect(parsed.case.auditEvents[0].id).toBe("audit-001");
    expect(parsed.case.recommendation?.decision).toBe("pilot");
  });

  it("round-trips the full case object", () => {
    expect(parsed.case).toEqual(ATLAS_OPPORTUNITY);
  });

  it("includes the seeded numbers in the payload", () => {
    expect(json).toContain("25.2");
    expect(json).toContain("audit-003");
  });
});

describe("toCsv", () => {
  const csv = toCsv(ATLAS_COMPARABLES);

  it("emits a header row and one row per comparable", () => {
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("comparabilityScore");
    expect(lines.slice(1)).toHaveLength(5);
  });

  it("lists all five seeded comparables", () => {
    expect(csv).toContain("cmp-northstar-data-license");
    expect(csv).toContain("cmp-meridian-api-integration");
    expect(csv).toContain("cmp-harbor-enterprise-channel");
    expect(csv).toContain("cmp-keystone-strategic-alliance");
    expect(csv).toContain("cmp-pioneer-hybrid-agreement");
  });
});
