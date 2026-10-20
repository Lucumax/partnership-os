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

---

# Round 2 — Consistency & Accessibility (2026-08-05)

Round 2 closed the documentation/screenshot gap that round 1 opened and added the WCAG 2.2
baseline that ROADMAP had deferred to v1.4. `src/lib/valuation/` was not touched; no new
runtime dependencies; `scripts/reconcile_check.py` unchanged and its output byte-identical.

## 1. Gates (K1) — all green, real output

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ 0 errors, 0 warnings |
| Typecheck | `npx tsc --noEmit` | ✅ 0 errors |
| Unit tests | `npx vitest run` | ✅ 6 files / **75 passed** (unchanged from round 1) |
| Build | `npm run build` | ✅ success, **10 routes prerendered static** |
| E2E | `npx playwright test` | ✅ **12 passed** (was 7; +5 new a11y tests) |
| Reconcile | `python scripts/reconcile_check.py` | ✅ `RECONCILIATION OK` |

`python scripts/reconcile_check.py` (byte-identical to the hard contract):

```
downside  GPV=14.0 CF=0.55 CAV=7.7   gap=-23.3
base      GPV=35.0 CF=0.72 CAV=25.2  gap=-5.8
upside    GPV=62.0 CF=0.78 CAV=48.4  gap=17.4
G-2 NPV of $31.0M nominal cash cost @ 12%: 25.62M
RECONCILIATION OK
```

Test counts: unit **75** (no change, never decreased), e2e **7 → 12** (+5). No existing assertion
was weakened or removed anywhere.

## 2. Task G — Screenshots regenerated & reproducible

- New `scripts/capture-screenshots.mjs`: builds the production app, starts `next start` on
  `:3100`, and captures **full-page, 1440×900 @ 2× deviceScaleFactor** screenshots of all seven
  primary routes, waiting ~2.5s for Recharts entrance animations to settle. It refuses to shoot a
  route that renders the Next.js error boundary. Production build ⇒ no dev-tools indicator can
  appear. One-line command (`node scripts/capture-screenshots.mjs`) documented in the README.
- Output: `docs/screenshots/01-dashboard.png` … `07-audit.png` (dashboard, opportunities index,
  atlas overview, valuation workbench, comparable library, negotiation brief, audit & decision
  history).
- All ten stale screenshots deleted: `hardened-*` (×6) and `track-a-*` / `track-b-*` (×4). No
  second generation remains.

## 3. Task H — README / ROADMAP accuracy

- **H1 (the credibility fix):** README "Stack" previously said the AI-assistant interface "is
  disabled by default and requires feature flags + credentials", implying the flags would turn it
  on. That was false — `ClaudePartnershipAnalysisAssistant` throws `NOT_IMPLEMENTED` even when
  fully configured and nothing in `src/app` or `src/components` calls `getAssistant()` at all.
  README now states the truth: the interface + deterministic fixture implementation exist and drive
  the `AI draft` labels; the live (Claude) implementation is a **typed stub** and its calls are not
  implemented; live AI is a demo boundary, not a flag switch.
- **H2:** README "Status" now describes the six-case portfolio (Atlas modeled end-to-end, five
  portfolio-level entries), the `/opportunities` index, and current-dated fixtures (2026-07-30).
- **H3:** README points at the new `01-…07-` screenshot filenames and documents the capture command.
- **H4 (mojibake):** verified rather than assumed. The ROADMAP title em dash is already correct
  UTF-8 (`e2 80 94` — hexdump confirmed); a byte scan of README and ROADMAP found **no** mojibake
  artifacts, so there was nothing to fix. The `OS ?"` claim did not reproduce in this tree.
- **H5/H6:** ROADMAP shipped-features table updated (six-case dashboard, `/opportunities` index,
  accessibility baseline; unit 75 / 10 static routes / 12 e2e). The multi-opportunity portfolio was
  moved out of the v1.1 future list into a **"Partially delivered"** note (portfolio-level shell
  only; one modeled case). Accessibility was moved out of the v1.4 deferred list into delivered as
  a **baseline**, with the formal audit + attestation still future. Nothing overstated.

## 4. Task I — Accessibility baseline (previously deferred to v1.4)

Issues found and fixed:

- **Nested `<main>` landmarks** in `negotiation` and `audit` pages (a `<main>` inside the layout's
  `<main>`) → outer elements changed to `<div>`; exactly one `<main>` per route now.
- **Heading outline:** `CardTitle` rendered a `<div>` (screen readers saw no outline). It now
  renders `<h2>` (no visual change), proposal sections `<h3>`→`<h2>`, comparable detail panels
  `<h4>`→`<h3>`. Every route has exactly one `<h1>` and an ordered outline with no skips.
- **Keyboard:** links in the sidebar, the dashboard/opportunities tables, and the back-links had
  hover-only affordances → explicit `focus-visible` classes plus a global
  `:focus-visible { outline: 2px solid var(--ring) }` safety net. The "Portfolio view only"
  tooltip trigger was a non-focusable `<span>` → now `tabIndex={0}` so the tooltip is reachable
  without a mouse.
- **Charts:** all five Recharts components were invisible to screen readers → each container is now
  `role="img"` with a **data-driven** `aria-label` describing the actual figures (per-stage counts,
  per-case spend/value/gap, per-scenario GPV/CAV/gap, waterfall steps), complementing the existing
  visible captions.
- **Tables:** `<th>` now defaults to `scope="col"`; every table across the app is named via an
  `aria-label` or an `sr-only` `<caption>`.
- **Icons:** decorative lucide icons made `aria-hidden` (audit timeline, exports, negotiation
  actions, red-team, sensitivities, confidence breakdown, proposal, back-links, expand/collapse).
  Meaning-bearing icons keep their button `aria-label`.
- **I7 (automated):** `tests/e2e/a11y.spec.ts` — 5 tests covering all 8 routes: one `h1` + ordered
  outline; landmarks + `lang="en"` + non-empty title; every table named + every `th` scoped; every
  chart has a real aria-label; keyboard focus is visible and never trapped (tabs through each route
  asserting a visible indicator and forward movement).

## 5. Task J — Docs date & number consistency

- Grepped `docs/` and `scripts/` for absolute 2025 dates: the only hits are genuine research
  citations in `docs/research/*` (FTC staff report Jan 2025; Stanford Law 2025; Warren/Wyden
  letters) — real publication references, left as-is. No stale demo-fixture dates exist in docs.
- `docs/VALUATION_RECONCILIATION.md` still matches the code exactly (14.0/35.0/62.0 ·
  0.55/0.72/0.78 · 7.7/25.2/48.4 · −23.3/−5.8/+17.4 · NPV 25.62) — no change needed.
- No doc states a portfolio total that contradicts the dashboard; verified the dashboard contract
  against `src/lib/fixtures/portfolio.ts` (Σgross 136.0 · ΣCAV 85.0 · Σspend 82.0 · 6 entries).
- `docs/UI_CONTRACT.md`: added a clearly-marked "Round 2 reconciliation" section (`/opportunities`
  route, `portfolio.ts` data source, UPPERCASE export names, superseded per-track screenshot
  instruction) and corrected the "Key exports" list to the actual names; historical contract text
  preserved.
- `docs/backlog/V1.1_BACKLOG.md`: added a note that the six-case portfolio shell shipped; all
  G-5..G-16 remain deferred.

## 6. Contrast — before → after (computed WCAG ratios)

Token changes in `globals.css` `:root` only (`--muted-foreground` 0.47→0.44, `--destructive`
0.58/0.2/30→0.54/0.2/28, `--chart-5` 0.70→0.62, `--input` 0.88→0.86). Palette otherwise untouched.

| Pair | Before | After | Requirement |
|---|---:|---:|---|
| `muted-foreground` on background | 6.35:1 | **7.22:1** | 4.5:1 text ✅ |
| `destructive` text on background | 4.39:1 | **5.21:1** | 4.5:1 text ✅ |
| destructive badge text on `bg-destructive/10` | 4.06:1 | **4.79:1** | 4.5:1 text ✅ |
| `chart-5` (non-text) on background | 2.44:1 | **3.32:1** | 3:1 non-text ✅ |
| `input` border on background | 1.34:1 | 1.42:1 | 3:1 non-text (see below) |
| `border` (hairline) on background | 1.25:1 | unchanged | 3:1 non-text (see below) |

## 7. Consciously left alone (with reasons)

- **Hairline borders don't reach 3:1 non-text.** WCAG 1.4.11's 3:1 for UI boundaries would require
  border lightness ≈ 0.58 — a much darker, heavy frame that redesigns the executive-tool aesthetic,
  which the spec forbids. Controls remain identifiable via their fill and focus-ring states; the
  residual gap is documented, not hidden.
- **`docs/research/*` 2025 citations** — real publication references, not fixture dates.
- **2025 comparable announcement dates in fixtures** — market history before the fixed 2026-07-30
  analysis date; the recency-decay (G-15) calculation depends on them.
- **No new unit tests.** Round-2 changes are UI/accessibility/docs; the a11y behaviour is enforced
  by the 5 new Playwright tests. Unit count unchanged at 75 (never decreased).
- **Audit "system system" actor badge** — pre-existing technical audit-log rendering, out of scope.
- **`package-lock.json`** carries a pre-existing platform diff (removal of `libc` metadata on
  optional binary packages, from an npm-version install difference). No dependency changed in round
  2, so it is left uncommitted rather than churning the lockfile.
- **Untracked environment files** (audit and prep notes, an original spec archive) are not part
  of the app and were not committed.

# Design pass — pipeline chart + legibility

Date of run: 2026-08-06 · Branch: `main` · same stack as above.

The owner reviewed the live site (https://partnership-os-one.vercel.app/) and raised two issues,
both correct: (1) "Pipeline by stage still doesn't look good" — the chart plotted opportunity
*count* on a portfolio with exactly one case per stage, so all six bars were length 1; (2) "Fonts
are too light" — `text-muted-foreground` passed WCAG AA but read washed out, and Geist at default
weight compounded it. This pass fixes both without touching `formulas.ts`/`engine.ts` or
redesigning the cream/plum palette and serif-heading type scale.

## 1. Gates — all green, real output

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | ✅ 0 errors |
| Typecheck | `npx tsc --noEmit` | ✅ 0 errors |
| Unit tests | `npx vitest run` | ✅ 11 files / **102 passed** (was 100; +2 fixture-shape regression tests) |
| Build | `npm run build` | ✅ success, all 10 routes still statically prerendered |
| E2E | `npx playwright test` | ✅ **30 passed** (unchanged count; several tests' underlying data changed and all still pass) |
| Reconcile | `python scripts/reconcile_check.py` | ✅ `RECONCILIATION OK` — GPV 14.0/35.0/62.0 · CF 0.55/0.72/0.78 · CAV 7.7/25.2/48.4 · gaps −23.3/−5.8/+17.4 · NPV 25.62 (byte-identical to spec; Atlas's own figures never moved) |

## 2. Task P — what the pipeline chart plots now, and why it's a better reading

**Before:** `StageFunnelChart` plotted `count` per stage. With one case per stage, every bar was
length 1 — a comb, not a funnel — and the caption admitted it ("one per stage").

**After:** the chart plots **confidence-adjusted value (CAV) summed per stage** as the bar length
(the strongest single measure, per the brief), with **case count as a direct label** at the end of
each bar as the secondary detail the brief allows. The stage that is Atlas's own (`Valuation`) is
tinted with a distinct highlight color (`--chart-3`) instead of the default series color, and a
stage with zero cases (`Contracting`) renders a visible hairline-colored sliver + "0 cases" label
via `minPointSize`, so an empty stage reads as a deliberate data point, not a rendering bug.

The card title changed from "Pipeline by stage" to **"Pipeline value by stage"**, the description
now states what's plotted ("Confidence-adjusted value (CAV) held at each stage — case count
labeled per bar"), and the caption below the chart is now a **computed finding**, not a mechanical
description:

> "Negotiation carries more confidence-adjusted value in a single case ($28.5M) than the 3 cases
> sitting in Inbound combined ($12.4M)."

That sentence is generated in `src/app/page.tsx` from the actual stage sums (`topValueStage` vs.
`highestCountStage`), not hardcoded — it will recompute honestly if the fixtures change again. The
result varies meaningfully bar-to-bar ($0M–$28.5M across 8 stages), tells a real story at a glance
(value concentrates late-stage despite most cases sitting early), and still reads as a pipeline
(same 8-stage vertical order, inbound → declined).

The chart's `aria-label` is fully data-driven: `"Confidence-adjusted value by stage: Inbound $12.4M
across 3 cases, …"` — regenerated from the same data the bars and labels use, so `a11y.spec.ts`
stays accurate after the change.

## 3. The reshaped portfolio, and its new totals

`src/lib/fixtures/portfolio.ts` went from 5 supporting cases (exactly one per non-Atlas stage) to
**9 supporting cases**, shaped like a real pipeline — mass in early stages, thinning through
negotiation/approval, one active, one declined:

| Stage | Cases | Names added |
|---|---|---|
| Inbound | 3 | Halcyon (existing) + **Solstice Data Exchange**, **Meridian Integration Bridge** (new) |
| Diligence | 2 | Vantage (existing) + **Beacon Distribution Network** (new) |
| Valuation | 1 | Atlas (fixed, engine-derived, unchanged) |
| Negotiation | 1 | Cascade (existing) |
| Approval | 1 | **Ridgeline Ecosystem Compact** (new) |
| Contracting | 0 | — (a real, deliberate gap) |
| Active | 1 | Pinnacle (existing) |
| Declined | 1 | Apex (existing) |

All new cases: clearly fictional, invented company names, `modeled: false` / no `href`
(portfolio-only), `confidenceAdjustedValueUsd < grossValueUsd`. Ridgeline's decision date
(2026-08-24, 25 days out) adds a third near-term decision on top of the existing two
(Vantage/Cascade), keeping the "decisions due in 30 days" KPI comfortably non-zero. Archetypes
spread across all 5 buckets (data licensing ×3, product integration ×2, distribution ×2, strategic
ecosystem ×2, hybrid ×1 [Atlas]) so concentration-by-archetype stays a real reading (Distribution
tops out at 30% of CAV — a genuine concentration signal, not a single 100% bar).

**Dashboard totals, honestly changed** (regression test `portfolio.test.ts` updated to match, not
fudged):

| Metric | Before (6 cases) | After (10 cases) |
|---|---:|---:|
| Pipeline value (Σ gross) | $136.0M | **$193.0M** |
| Confidence-adjusted value (Σ CAV) | $85.0M | **$120.2M** |
| Proposed spend (Σ cost) | $82.0M | **$111.5M** |
| Cases paying for themselves | — | 7 of 10 |
| High-risk opportunities | 2 | 3 |

Atlas's own numbers ($35.0M gross / $25.2M CAV / $31.0M cost / −$5.8M gap) are untouched — they
come from `computeValuation()`, never hardcoded, and the reconciliation script proves they didn't
drift.

## 4. Task P3 — one chart system, not five

All five charts (`stage-funnel`, `value-vs-spend-scatter`, `concentration-by-archetype`,
`value-range-chart`, `value-waterfall`) now share one categorical role mapping instead of each
picking `--chart-N` tokens ad hoc:

| Role | Token | Used in |
|---|---|---|
| Confidence-adjusted value (the primary "value" reading) | `--chart-1` (teal) | stage-funnel bars, scatter points, concentration bars, value-range CAV bar, waterfall value components |
| Gross / less-adjusted value (same entity, lighter cut) | `--chart-5` (light teal — same hue family as chart-1, sequential relationship) | value-range gross bar, waterfall gross total |
| "This is Atlas / the modeled case" highlight | `--chart-3` (blue-violet) | stage-funnel's active-stage bar, scatter's Atlas point — both carry a text legend, never color alone |
| Cost / negative | `--destructive` (red) | value-range cost line, waterfall cost bars |

Also standardized: every chart's axis ticks now set an explicit `fill: var(--muted-foreground)` +
`fontWeight: 500` (previously unset, which meant Recharts silently fell back to its own hardcoded
`#666` default, completely untied from the app's theme — a real bug independent of the "light
text" complaint, since it meant axis ticks never respected dark mode or any token change). Number
formatting is unified on the shared `formatM`/`formatPercent` helpers (`src/components/portfolio/format.ts`)
instead of each chart re-implementing its own `fmt()`. Tooltips now lead with a **finding**:

- Scatter: "Pays for itself by $8.5M" / "Falls short by $0.2M" (was three raw value lines)
- Value-range: "Risk discount removes $9.8M (28%) versus gross" (new leading line, raw breakdown kept below)
- Stage funnel / concentration: value + share stated in one line, case count/percentage as the read

A small direct-labeled legend was added under the scatter chart ("Atlas (modeled case)" /
"Portfolio-only cases") since two colors now carry identity there — color never carries meaning
alone.

## 5. Task Q — typography legibility: before → after

Only `--muted-foreground` was darkened (per the brief, nothing else in the palette or type scale
changed). Ratios computed with a standalone OKLCH→sRGB WCAG calculator (relative-luminance
formula) against every surface the token actually renders on:

| Surface pair | Before | After | Floor |
|---|---:|---:|---|
| Light muted-fg vs. `background` | 7.24:1 | **9.34:1** | 4.5:1 |
| Light muted-fg vs. `card` | 7.65:1 | **9.87:1** | 4.5:1 |
| Light muted-fg vs. `muted` (badges/hover) | 6.63:1 | **8.55:1** | 4.5:1 |
| Dark muted-fg vs. `background` | 7.36:1 | **9.20:1** | 4.5:1 |
| Dark muted-fg vs. `card` | 6.77:1 | **8.46:1** | 4.5:1 |
| Dark muted-fg vs. `muted` | 5.81:1 | **7.26:1** | 4.5:1 |

The token was already comfortably past the 4.5:1 floor (this is what "AA already passed" meant in
the original complaint) — the fix pushes it further past the floor (light: L 0.44→0.38, chroma
0.02→0.025; dark: L 0.70→0.76, chroma unchanged) *and*, more importantly, pairs the darker color
with **added font-weight**, since the original "washed out" complaint was as much about Geist at
regular weight on small (11–12px) text as it was about contrast headroom.

**Weight changes** (`font-medium`, 500, added; nothing heavier — the type scale itself is
untouched):

- `CardDescription` (shared `ui/card.tsx`) — cascades to every card description app-wide
- `KpiCard` captions/detail lines
- `TableCaption` (shared `ui/table.tsx`)
- `.data-label` and `.evidence-strip` utility classes in `globals.css`
- Table secondary columns: owner columns, partner-alias sub-labels, "—" placeholders, approver
  column, assumption-table "updated" column (4 call sites)
- Sidebar footer ("Synthetic demo data" / "Local-first MVP") and workspace kicker
- Topbar "Stage …" / "Owner …" secondary text
- Every chart's axis-tick labels (see §4) and the waterfall's delta labels (weight 600)

Scope was held to the brief's named offenders (KPI cards, chart axis ticks, table secondary
columns, card descriptions, footer text) rather than a blanket sweep of all ~39 files using
`text-muted-foreground` — the shared-component edits (`CardDescription`, `.data-label`) already
reach most of the app for free since nearly every secondary-text pattern in this codebase routes
through one of those two.

## 6. Screenshots — regenerated, full-length, and a real tooling bug found along the way

All 7 screenshots regenerated via `node scripts/capture-screenshots.mjs` and opened individually:

| File | Dimensions (1440×900 viewport, 2x DPR) | Full-length? |
|---|---|---|
| `01-dashboard.png` | 2880×2994 | ✅ (>3x viewport height) |
| `02-opportunities.png` | 2880×1800 | ✅ (page's natural content is exactly one viewport tall — not a stub) |
| `03-overview.png` | 2880×5110 | ✅ |
| `04-valuation.png` | 2880×5454 | ✅ |
| `05-comparables.png` | 2880×1800 | ✅ (same as opportunities — short page, not a stub) |
| `06-negotiation.png` | 2880×4892 | ✅ |
| `07-audit.png` | 2880×3696 | ✅ |

While regenerating, the dashboard screenshot came back with all three chart panels **completely
blank** (axes/labels present, no bars/points) — reproducible across three separate runs. Root
cause, confirmed by instrumenting the capture script: `scripts/capture-screenshots.mjs` spawns its
prod server with `spawn("npx", ["next", "start", …], { shell: true })`. On Windows, `shell: true`
makes `server` the `cmd.exe` wrapper, not the actual `next-server` process it launches — so
`server.kill("SIGTERM")` in the script's `cleanup()` only killed the wrapper, leaving a real
`next-server` **zombie process bound to port 3100** after every run. The next invocation's
`waitForServer()` happily connected to that stale zombie (serving an old build) instead of the
freshly-spawned server — and one stale JS chunk 500'd, silently breaking client-side hydration for
just the dashboard's client chart components while server-rendered content around them (KPI cards,
tables, captions) rendered fine, producing exactly the "some things blank, everything else normal"
symptom observed. This was pre-existing tooling risk, not something introduced by the chart edits
in this pass — confirmed by reproducing the same blank output against an untouched build once a
zombie was present, and a clean result once it was killed.

Fixed in `scripts/capture-screenshots.mjs`: `cleanup()` now uses `taskkill /pid <pid> /T /F` on
Windows to kill the whole process tree instead of just the shell wrapper. Verified by running the
script twice in a row from a cold state and confirming port 3100 is fully released after each run
(`netstat` shows no LISTENING socket post-exit) and that the dashboard's three charts render
correctly both times. A modest 500ms settle wait was also added after the full-page
overflow/height DOM release, as defensive margin against Recharts' `ResizeObserver` re-render
timing on reflow (not the root cause here, but a real risk class for this capture pattern).

## 7. Honest read: does everything land?

- **Pipeline value by stage** — yes, this is the strongest fix in the pass. It went from a
  discredited comb chart to bars that vary by an order of magnitude and a caption that states a
  specific, true, non-obvious finding.
- **Value versus spend** — reads well with 10 points instead of 6; the Atlas-highlight color plus
  its own legend keeps it from being just "one weird blue dot."
- **Concentration by archetype** and **value range (waterfall/scenario bars)** are solid but
  visually the least changed of the five — they were already reasonably well-formed single-measure
  bar charts, so this pass mainly unified their color/tick/formatting rather than restructuring
  them. If there's a residual weak spot, it's that these two are the least "designed" of the five;
  they'd benefit most from a follow-up pass if there's a next round.
- **Contracting's empty bar** is a deliberate, labeled zero, not a bug — but it's worth flagging
  that an empty pipeline stage is an unusual thing to show without a full walkthrough;
  it reads fine once you notice the "0 cases" label, but it is the one place in the dashboard where
  a first glance could momentarily register as "is that a rendering error?" before the label
  resolves it.
