import { describe, expect, it } from "vitest";

import { fmtMoney, fmtMoneyPrecise, fmtSignedMoney } from "@/components/valuation/format";

describe("valuation format thousands separators", () => {
  it("fmtMoney inserts a comma above 999", () => {
    expect(fmtMoney(1513.0)).toBe("$1,513.0M");
    expect(fmtMoney(1234567.89)).toBe("$1,234,567.9M");
  });

  it("fmtMoney is unchanged below 1000 (does not affect the seeded reconciliation figures)", () => {
    expect(fmtMoney(25.2)).toBe("$25.2M");
    expect(fmtMoney(7.7)).toBe("$7.7M");
    expect(fmtMoney(48.4)).toBe("$48.4M");
    expect(fmtMoney(31)).toBe("$31.0M");
  });

  it("fmtMoneyPrecise inserts a comma above 999", () => {
    expect(fmtMoneyPrecise(1513.456)).toBe("$1,513.46M");
  });

  it("fmtSignedMoney groups thousands on both sides of the sign", () => {
    expect(fmtSignedMoney(1500)).toBe("+$1,500.0M");
    expect(fmtSignedMoney(-1500)).toBe("−$1,500.0M");
  });

  it("fmtSignedMoney is unchanged below 1000", () => {
    expect(fmtSignedMoney(-5.8)).toBe("−$5.8M");
    expect(fmtSignedMoney(17.4)).toBe("+$17.4M");
  });
});
