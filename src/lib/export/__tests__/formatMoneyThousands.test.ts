import { describe, expect, it } from "vitest";

import { formatUsdM, formatUsdMDelta } from "@/lib/export/format";

describe("export format thousands separators", () => {
  it("formatUsdM groups thousands above 999", () => {
    expect(formatUsdM(1513.0)).toBe("$1,513.0M");
    expect(formatUsdM(-2000)).toBe("-$2,000.0M");
  });

  it("formatUsdM is unchanged below 1000 (does not affect export golden tests)", () => {
    expect(formatUsdM(25.2)).toBe("$25.2M");
    expect(formatUsdM(31)).toBe("$31.0M");
  });

  it("formatUsdMDelta groups thousands and keeps the sign convention", () => {
    expect(formatUsdMDelta(1500)).toBe("+$1,500.0M");
    expect(formatUsdMDelta(-1500)).toBe("-$1,500.0M");
    expect(formatUsdMDelta(0)).toBe("+$0.0M");
  });
});
