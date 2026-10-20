import { describe, expect, it } from "vitest";

import { formatM } from "@/components/portfolio/format";

describe("portfolio format thousands separators", () => {
  it("groups thousands above 999", () => {
    expect(formatM(1513.0)).toBe("$1,513.0M");
    expect(formatM(-2500.25, { dp: 2 })).toBe("−$2,500.25M");
  });

  it("is unchanged below 1000", () => {
    expect(formatM(25.2)).toBe("$25.2M");
    expect(formatM(31)).toBe("$31.0M");
  });

  it("keeps the existing sign option working alongside grouping", () => {
    expect(formatM(1200, { sign: true })).toBe("+$1,200.0M");
    expect(formatM(0, { sign: true })).toBe("$0.0M");
  });
});
