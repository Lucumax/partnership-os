# Valuation Reconciliation (seeded synthetic case)

This document is the source of truth for why the seeded Atlas case produces exactly the
published numbers in the original synthetic demo data notes. The engine and every golden test derive
from this table. Do not change the seeded outputs without updating this document and the
golden tests together.

Status: **MVP v1.0.** Includes the bounded research additions G-1, G-2, G-3, G-4, G-11, G-15.
G-5..G-10 and G-12..G-14, G-16 are deferred to `docs/backlog/V1.1_BACKLOG.md`.

---

## 1. Fixed targets (must reproduce exactly)

| Scenario | GPV | CF | CAV | Cost | Gap |
|---|---:|---:|---:|---:|---:|
| Downside | $14.0M | 0.55 | $7.7M | $31.0M | −$23.3M |
| Base | $35.0M | 0.72 | $25.2M | $31.0M | −$5.8M |
| Upside | $62.0M | 0.78 | $48.4M | $31.0M | +$17.4M |

Arithmetic:

- `CAV = GPV × CF`: 14.0×0.55=7.7 ✓ · 35.0×0.72=25.2 ✓ · 62.0×0.78=48.36 → **48.4** ✓ (rounding to 1 dp)
- `Gap = CAV − Cost`: 7.7−31=−23.3 ✓ · 25.2−31=−5.8 ✓ · 48.4−31=+17.4 ✓

### Where $31.0M comes from

```text
Upfront payment          $4.0M
Annual license  3 yr   $6.0M/yr  = $18.0M
Min usage       3 yr   $3.0M/yr  = $9.0M
Total proposed economic cost     = $31.0M
```

---

## 2. Value stack components (per scenario, $M)

The MVP value stack (with G-11 brand value `BV` added and G-4 exit cost `EC` added):

```text
GPV = DFV + UCV + PCV + DV + SOV + LV + BV
      − IC − EOC − ERC − CLC − EC
```

### Downside (target GPV 14.0)

| Kind | Component | Value |
|---|---|---|
| + | DFV direct financial | 10.0 |
| + | UCV usage & customer | 3.0 |
| + | PCV product capability | 2.0 |
| + | DV distribution | 2.0 |
| + | SOV strategic option | 1.0 |
| + | LV learning | 0.5 |
| + | BV brand/ecosystem (G-11) | 0.5 |
| − | IC implementation | 1.0 |
| − | EOC exclusivity & opportunity | 1.0 |
| − | ERC expected risk cost | 1.5 |
| − | CLC concentration & lock-in | 0.5 |
| − | EC exit / break-up cost (G-4) | 1.0 |
| **=** | **GPV** | **14.0** |

### Base (target GPV 35.0)

| Kind | Component | Value |
|---|---|---|
| + | DFV | 26.0 |
| + | UCV | 8.0 |
| + | PCV | 4.0 |
| + | DV | 3.0 |
| + | SOV | 2.0 |
| + | LV | 0.5 |
| + | BV | 1.0 |
| − | IC | 1.5 |
| − | EOC | 3.0 |
| − | ERC | 2.0 |
| − | CLC | 1.0 |
| − | EC | 2.0 |
| **=** | **GPV** | **35.0** |

### Upside (target GPV 62.0)

| Kind | Component | Value |
|---|---|---|
| + | DFV | 46.0 |
| + | UCV | 13.0 |
| + | PCV | 7.0 |
| + | DV | 5.0 |
| + | SOV | 2.0 |
| + | LV | 0.5 |
| + | BV | 1.0 |
| − | IC | 1.5 |
| − | EOC | 5.0 |
| − | ERC | 1.5 |
| − | CLC | 1.5 |
| − | EC | 3.0 |
| **=** | **GPV** | **62.0** |

Design rationale (auditable, not magic):

- **Value components rise** downside → base → upside (adoption, monetization, distribution).
- **ERC (expected risk cost) peaks in base** ($2.0M) and is lower in downside ($1.5M, because
  downside already assumes failure) and upside ($1.5M). This is a deliberate modeling choice:
  in the downside scenario the risk-adjusted adoption is already low, so residual risk cost is
  smaller; the base case carries the largest un-hedged risk.
- **EC (exit cost, G-4)** rises with commitment: $1.0M / $2.0M / $3.0M.
- **EOC (exclusivity & opportunity cost)** rises with success: $1.0M / $3.0M / $5.0M — the
  more the deal is worth, the more foreclosed alternatives cost.
- **CLC** rises slightly with scale: $0.5M / $1.0M / $1.5M.

### Expected risk cost decomposition (ERC)

`ERC = Σ probability_i × impact_i`. The per-scenario ERC is built from seeded risk items:

| Scenario | Risk item | P | Impact | P×I |
|---|---|---|---|---|
| Downside | Adoption shortfall | 0.50 | 2.0 | 1.0 |
| Downside | Implementation overrun | 0.50 | 1.0 | 0.5 |
| Downside | ERC total | | | **1.5** |
| Base | Adoption shortfall | 0.40 | 3.0 | 1.2 |
| Base | Regulatory change (G-3) | 0.20 | 3.0 | 0.6 |
| Base | Key-person dependency | 0.20 | 1.0 | 0.2 |
| Base | ERC total | | | **2.0** |
| Upside | Regulatory change (G-3) | 0.15 | 5.0 | 0.75 |
| Upside | Renewal failure | 0.30 | 2.5 | 0.75 |
| Upside | ERC total | | | **1.5** |

---

## 3. Confidence factor (5 equal-weight dimensions)

`CF = mean(evidence_quality, assumption_stability, comparable_quality, implementation_certainty, partner_execution)`

| Scenario | evidence | stability | comparables | implementation | partner | mean |
|---|---|---|---|---|---|---|
| Downside | 0.40 | 0.50 | 0.60 | 0.60 | 0.65 | **0.55** |
| Base | 0.60 | 0.70 | 0.75 | 0.80 | 0.75 | **0.72** |
| Upside | 0.70 | 0.80 | 0.80 | 0.80 | 0.80 | **0.78** |

Each dimension is stored separately and displayed; the mean is the CF. Golden test asserts the
mean reproduces the published CF within ±0.005.

---

## 4. G-2 NPV (time value of money) — MVP semantics

The MVP applies discounting to the **contract cash side only** (upfront + annual license +
annual minimum usage) because those are the real, contractually-specified cash flows. The value
stack components (DFV…BV) are treated as **present values at the valuation date** (each is
already a discounted value judgment), so the stack is not re-discounted.

```text
NPV(cash cost) = PV(4.0 @ t=0) + Σ_{y=1..3} PV(6.0 @ end-yr) + Σ_{y=1..3} PV(3.0 @ end-yr)
```

At a default discount rate of **12%**: NPV = $25.62M vs $31.0M nominal (time value ≈ $5.38M).
The discount rate is an explicit assumption (`discountRate`, default 0.12), surfaced in the
assumption register. This is a bounded MVP choice; full NPV-of-value-stack is deferred (G-8/G-10).

**Golden test:** NPV(cash cost) must be in (24.0, 28.0) at the default rate, and strictly below
the $31.0M nominal.

---

## 5. G-1 typed data-rights (data model addition)

`ProposalTerms.dataRights` and `productRights` become structured (was `string[]`):

```ts
type AiUseRight =
  | "training" | "inference" | "outputs" | "model_weights"
  | "feedback_data" | "derivative_works";
type DataRight = { use: AiUseRight; scope: "granted" | "denied" | "negotiable"; note?: string };
```

Seeded Atlas terms: training=negotiable, inference=granted, outputs=granted,
model_weights=denied, feedback_data=negotiable, derivative_works=negotiable. No seeded value
change; this is a type/UX addition only.

## 6. G-3 regulatory screening (data model addition)

`RiskItem.category` gains `regulatory`; a canned flag taxonomy is added to the proposal intake:

```ts
type RegulatoryFlag =
  | "hsr_merger_control" | "exclusivity_preferential_access"
  | "ai_act" | "data_export" | "foreign_investment" | "responsible_scaling";
```

Seeded Atlas case: `exclusivity_preferential_access` = open (drives the base-case regulatory
risk item above); others = not-applicable. No seeded value change.

## 7. G-15 comparable recency (engine addition)

Comparability score adds a recency decay: comparables announced more than 24 months before the
analysis date get their `comparabilityScore` multiplied by a decay factor
`max(0.5, 1 − months_over_24 / 48)`. Golden test: a stale comparable scores strictly lower
than an otherwise-identical recent one.

## 8. Verification

```bash
python scripts/reconcile_check.py   # prints each scenario, asserts GPV/CF/CAV/gap and NPV bounds
```

The TypeScript engine's golden tests (`src/lib/valuation/__tests__/*.test.ts`) assert the same
numbers within rounding tolerance (±0.05 for money, ±0.005 for CF) and reference this document.
