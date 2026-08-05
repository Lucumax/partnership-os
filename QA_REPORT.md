# QA Report — v1.0.1 "Credible Portfolio"

Date of run: 2026-08-05 · Branch: `feat/credible-portfolio` · Next.js 16.3.0 (Turbopack), React 19, Recharts 3, Vitest 4, Playwright 1.62.

## 1. Gates (F1) — all green, with real output

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ 0 errors (0 warnings) |
| Typecheck | `npx tsc --noEmit` | ✅ 0 errors |
| Unit tests | `npx vitest run` | ✅ 6 files / **75 passed** (was 63; +12 portfolio regression tests) |
| Build | `npm run build` | ✅ success, 10 routes prerendered as static |
| E2E | `npx playwright test` | ✅ **7 passed** |
| Reconcile | `python scripts/reconcile_check.py` | ✅ `RECONCILIATION OK` |

Build route list (all static):

```
○ /                         ○ /opportunities          ○ /opengraph-image
○ /comparables              ○ /opportunities/atlas     ○ /opportunities/atlas/audit
○ /opportunities/atlas/negotiation · /opportunities/atlas/proposal · /opportunities/atlas/valuation
```

`python scripts/reconcile_check.py` output (unchanged from the contract):

```
downside  GPV=14.0 CF=0.55 CAV=7.7   gap=-23.3
base      GPV=35.0 CF=0.72 CAV=25.2  gap=-5.8
upside    GPV=62.0 CF=0.78 CAV=48.4  gap=17.4
G-2 NPV of $31.0M nominal cash cost @ 12%: 25.62M
RECONCILIATION OK
```

The seeded Atlas numbers are byte-identical to the hard contract. The engine
(`src/lib/valuation/`) was not touched.

## 2. Cross-screen number check (F3)

The Atlas case must show the same figures on the dashboard, the opportunity overview, and the
valuation workbench. Enforced by a new Playwright test (`Atlas figures agree across dashboard,
overview, and valuation workbench`) and spot-checked by hand:

| Screen | GPV | CAV | Base gap |
|---|---|---|---|
| Dashboard (upcoming-decisions row) | — | $25.2M | −$5.8M |
| `/opportunities/atlas` (overview) | $35.0M | $25.2M | −$5.8M |
| `/opportunities/atlas/valuation` | $35.0M | $25.2M | −$5.8M |

All agree. (Dashboard does not print Atlas gross on its own row, so that cell is blank rather
than asserted.)

## 3. Portfolio arithmetic, by hand (F4)

Confirmed against the live dashboard and the fixtures:

| Aggregate | Computation | Value | Dashboard shows |
|---|---|---|---|
| Pipeline value | 35 + 6 + 18 + 44 + 22 + 11 | **$136.0M** | $136.0M |
| Confidence-adjusted value (CAV) | 25.2 + 4.2 + 9.3 + 28.5 + 14 + 3.8 | **$85.0M** | $85.0M |
| Proposed spend | 31 + 2.5 + 9.5 + 20 + 10 + 9 | **$82.0M** | $82.0M |
| Funnel counts | inbound 1 · diligence 1 · valuation 1 · negotiation 1 · active 1 · declined 1 | **6** | 6 bars |
| Concentration shares | data_licensing 8.0 · product_integration 9.3 · distribution 28.5 · strategic_ecosystem 14.0 · hybrid 25.2 | **100.0%** | 5 bars |

Scatter: 6 points, 3 above the break-even line (Halcyon +$1.7M, Cascade +$8.5M, Pinnacle +$4.0M),
3 below (Atlas −$5.8M, Vantage −$0.2M, Apex −$5.2M). KPI row: pipeline $136.0M · CAV $85.0M ·
spend $82.0M · active negotiations 2 · **decisions due in 30 days: 2** · high-risk 2.

## 4. Responsive (F5)

New Playwright test asserts **no horizontal overflow** on every route at 1280×900 and 1440×900 —
passes. KPI values verified non-truncated via layout metrics (scrollWidth ≤ clientWidth). The
wide `/opportunities` table scrolls inside its own overflow container as intended (the page
itself does not overflow).

## 5. Human copy read-through (F6)

The screens now read like a colleague explaining the decision, not a spec. Every screen opens
with "what decision does this screen help me make" (e.g. dashboard: *"Start here: see where the
pipeline stands, which deals would pay for themselves, and what needs a decision next."*).
Chart captions state the finding, not the mechanics (scatter: *"3 of 6 cases land above the
dashed break-even line and pay for themselves at their proposed cost. The others — including
Atlas and the case we declined — fall short."*). Acronyms are expanded on first use per screen
(GPV, CAV, NPV, ERC). All honesty labels — "Synthetic", "AI draft · not human-approved",
"Synthetic demo data", "Local-first MVP · no live AI" — are unchanged and as strong as before.

**Fixed during QA (from this read):**
- Removed bare research-gate tags `(G-2) / (G-3) / (G-4) / (G-11) / (G-15)` from user-facing copy
  on 6 surfaces (valuation footer, comparables intro/footer, comparable-table "Recency (G-15)"
  panel, proposal "Regulatory screening (G-3)", assumption evidence strings, red-team-list
  "G-3 flag"). They are internal roadmap references and read as spec-document jargon; the
  underlying methodology text stays.
- Expanded "CAV" on first use in the `/opportunities` intro.
- `formatM` (dashboard/portfolio formatters) now uses the Unicode minus `−` to match the
  valuation screens' minus glyph, so negative gaps render identically across screens.

**Consciously left alone:**
- Comparable **announcement dates in 2025** (2025-02-20, 2025-05-10, 2025-07-12) remain on
  `/comparables`. These are the +13-month-shifted fixture dates mandated by Task B1; relative to
  the fixed analysis date 2026-07-30 they sit inside the 24-month recency window and are
  realistic market history. The DoD "no 2025 date in the UI" is about stale demo-activity dates
  (analysis/decision/assumption dates), which are all 2026+. Making comparables "no 2025" would
  either break recency semantics or imply future-dated deals.
- Audit timeline shows the actor name + actor-type badge as e.g. "system system". Pre-existing,
  technical audit-log rendering; left as-is to avoid changing audit semantics.
- `@/lib/valuation/*` untouched (hard constraint). No new runtime deps, no network calls at
  build/runtime, live-assistant feature flags remain default-false.

## 6. What this build changed (summary)

- **Task A** — `src/lib/fixtures/portfolio.ts` (lightweight `PortfolioEntry`, Atlas derived from
  the engine, 5 fictional supporting cases), dashboard rewritten to consume `PORTFOLIO_ENTRIES`,
  **fixed the latent aggregation bug** (aggregators now read per-entry fields; previously every
  reduce re-added Atlas's figures, multiplying by case count), drill-through honesty
  (`Portfolio view only` badge + tooltip + helper disclosure), regression test
  (`src/lib/fixtures/__tests__/portfolio.test.ts`, +12 tests).
- **Task B** — every ISO date in `src/lib/fixtures/atlas.ts`, the valuation assumption-model
  display dates, and the recency-decay test dates shifted by exactly +13 months; fixed-constant
  comment added; reconciliation byte-identical.
- **Task C** — `/opportunities` index table; sidebar "Opportunities" → `/opportunities` (isActive
  already covers both); route added to the QA suite.
- **Task D** — metadataBase + openGraph + twitter in `layout.tsx`; `src/app/opengraph-image.tsx`
  (1200×630, next/og, no new deps). Verified serving: HTTP 200, `image/png`, og/twitter tags
  present in the head.
- **Task E** — human-centered copy pass across the deep screens and supporting components.
- **Task F** — this report; `qa.spec.ts` extended (routes incl. `/opportunities`, render-artifact
  checks for NaN/Infinity/undefined/empty cells, cross-screen Atlas figures, responsive check).

## 7. Known open items (nothing blocking)

- The dashboard "Recent assumption changes" card is Atlas-only; it is retitled to make that
  explicit rather than pretending to be portfolio-wide.
- `npx vitest run` emits a Vite warning about ESM-in-CJS config loading (`configLoader: 'native'`).
  Pre-existing, non-fatal.
