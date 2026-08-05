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
- **Untracked environment files** (`GITHUB_AUDIT_REPORT.md`, `PREP_MANIFEST.md`,
  `anthropic_partnership_value_os_spec.zip`, `spec/anthropic_partnership_value_os/`) are not part
  of the app and were not committed.
