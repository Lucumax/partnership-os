"""Verify the seeded Partnership OS valuation reconciliation.

Targets (from the original synthetic demo data notes):
  GPV: down 14.0, base 35.0, up 62.0
  CF:  down 0.55, base 0.72, up 0.78
  CAV = GPV * CF: 7.7, 25.2, 48.4 (48.36 rounds to 48.4)
  Cost = 31.0 (constant): 4.0 upfront + 3*(6.0 license + 3.0 min usage)
  Gap = CAV - cost: -23.3, -5.8, +17.4

MVP (v1.0) includes G-1 (typed DataRights), G-2 (NPV), G-3 (regulatory),
G-4 (exit cost EC added to stack), G-11 (brand value BV), G-15 (recency).

NPV semantics (G-2, MVP scope): the model computes the NPV of the CASH side of
the deal (upfront + annual license + annual minimum usage) because that is a
real, contractually-specified cash flow. The value stack components (DFV, UCV,
PCV, DV, SOV, LV, BV) are treated as PRESENT VALUES at the valuation date
(each is already a discounted value judgment), so the stack itself is not
re-discounted. Discounting applies to the contract cash flows only; this is
documented and bounded for the MVP and revisited in v1.1 (G-8/G-10).
"""

SCENARIOS = {
    "downside": {
        "value": {"DFV": 10.0, "UCV": 3.0, "PCV": 2.0, "DV": 2.0, "SOV": 1.0, "LV": 0.5, "BV": 0.5},
        "cost": {"IC": 1.0, "EOC": 1.0, "ERC": 1.5, "CLC": 0.5, "EC": 1.0},
        "cf": 0.55,
        "gpv_target": 14.0,
    },
    "base": {
        "value": {"DFV": 26.0, "UCV": 8.0, "PCV": 4.0, "DV": 3.0, "SOV": 2.0, "LV": 0.5, "BV": 1.0},
        "cost": {"IC": 1.5, "EOC": 3.0, "ERC": 2.0, "CLC": 1.0, "EC": 2.0},
        "cf": 0.72,
        "gpv_target": 35.0,
    },
    "upside": {
        "value": {"DFV": 46.0, "UCV": 13.0, "PCV": 7.0, "DV": 5.0, "SOV": 2.0, "LV": 0.5, "BV": 1.0},
        "cost": {"IC": 1.5, "EOC": 5.0, "ERC": 1.5, "CLC": 1.5, "EC": 3.0},
        "cf": 0.78,
        "gpv_target": 62.0,
    },
}

COST_TOTAL = 31.0
DISCOUNT_RATE = 0.12
UPFRONT = 4.0
ANNUAL_LICENSE = 6.0
ANNUAL_MIN_USAGE = 3.0


def pv(amount_m, months_offset):
    years = months_offset / 12.0
    return amount_m / ((1 + DISCOUNT_RATE) ** years)


def npv_of_annual(annual_m):
    return sum(pv(annual_m, (y + 1) * 12) for y in range(3))


def main():
    for name, s in SCENARIOS.items():
        v = sum(s["value"].values())
        c = sum(s["cost"].values())
        gpv = v - c
        cav = round(gpv * s["cf"], 1)
        gap = round(cav - COST_TOTAL, 1)
        ok = abs(gpv - s["gpv_target"]) < 0.01
        print(f"== {name} ==")
        print(f"  value_sum={v} cost_sum={c} GPV={gpv} (target {s['gpv_target']}) {'OK' if ok else 'MISS'}")
        print(f"  CF={s['cf']} CAV={cav} gap={gap}")
        assert ok, f"GPV mismatch {name}"

    # G-2 NPV of the contract cash side (the only real cash flows).
    npv_total = pv(UPFRONT, 0) + npv_of_annual(ANNUAL_LICENSE) + npv_of_annual(ANNUAL_MIN_USAGE)
    print(f"\nG-2 NPV of $31.0M nominal cash cost @ {DISCOUNT_RATE:.0%}: {npv_total:.2f}M")
    assert 24.0 < npv_total < 28.0, "NPV of cash cost must be below nominal"
    print(f"G-2 nominal cost {COST_TOTAL} vs NPV {npv_total:.2f} (difference = time value, {COST_TOTAL - npv_total:.2f}M)")

    # Confidence factor checks: equal-weight 5 dimensions reproduce CF.
    cf_dims = {
        "downside": [0.4, 0.5, 0.6, 0.6, 0.65],
        "base": [0.6, 0.7, 0.75, 0.8, 0.75],
        "upside": [0.7, 0.8, 0.8, 0.8, 0.8],
    }
    for name, dims in cf_dims.items():
        cf = round(sum(dims) / len(dims), 2)
        print(f"CF {name}: dims={dims} mean={cf} (target {SCENARIOS[name]['cf']}) {'OK' if abs(cf-SCENARIOS[name]['cf'])<0.005 else 'MISS'}")
        assert abs(cf - SCENARIOS[name]["cf"]) < 0.005
    print("\nRECONCILIATION OK")


if __name__ == "__main__":
    main()
