# UI Contract for Parallel Tracks (MVP v1.0)

All four UI tracks build against this contract. It is derived from `spec/04_UI_WIREFRAME.md`
and `spec/08_BUILD_PROMPT_V4_FLASH.md`, plus the shared engine in `src/lib`.

## Round 2 reconciliation (credible-portfolio build)

Added retroactively in round 2 to record how the shipped app diverges from this contract.
The historical contract text below is preserved as-is; this section supersedes it where they
conflict.

- **(a)** The `/opportunities` portfolio index route was added in round 1 and now belongs to
  Track A (`src/app/opportunities/page.tsx`).
- **(b)** Portfolio-level data now comes from `src/lib/fixtures/portfolio.ts`
  (`PORTFOLIO_ENTRIES` / `PortfolioEntry`) in addition to the Atlas fixtures in
  `src/lib/fixtures/atlas.ts`; `src/lib/fixtures/index.ts` re-exports both.
- **(c)** The exported fixture names use the UPPERCASE convention (`ATLAS_OPPORTUNITY`,
  `ATLAS_COMPARABLES`, `PORTFOLIO_ENTRIES`, …) rather than the camelCase listed under
  "Key exports" below; that list has been corrected.
- **(d)** Screenshots under `docs/screenshots/` were regenerated in round 2. The old
  "each track produces its own screenshots" instruction below is superseded by
  `scripts/capture-screenshots.mjs`.

## Tech and conventions

- Next.js 16 App Router, TypeScript strict, Tailwind v4 (globals.css), shadcn/ui (already in
  `src/components/ui`), Recharts.
- Client components: add `"use client"` where interactivity is needed. Pages themselves can be
  server components that render client islands.
- Import path alias `@/*` maps to `src/*`.
- Internal executive-tool aesthetic: restrained neutral palette (the default shadcn neutral
  preset), dense readable tables, no gradients, no stock imagery, no chatbot-first layout.
- Use the shadcn components: `Button, Card, Table, Tabs, Badge, Input, Select, Textarea,
  Separator, Tooltip, Sheet, Dialog`.
- Money display: **values are in $M** (e.g. `26.0` = $26.0M). Format as `$26.0M`.

## Shared data source

Everything reads from `src/lib/fixtures/index.ts` (the seeded Atlas case) and the engine in
`src/lib/valuation/engine.ts`. Do NOT hardcode seeded numbers in UI; import from fixtures and
run the engine.

Key exports (verify against `src/lib/fixtures/index.ts` and `src/lib/domain/types.ts`):
- `ATLAS_OPPORTUNITY` (Opportunity)
- `ATLAS_COMPARABLES` (ComparableTransaction[])
- `PARTNERSHIP_ARCHETYPES` (labels for the 5 archetypes)
- `PORTFOLIO_ENTRIES` / `ATLAS_PORTFOLIO_ENTRY` (PortfolioEntry / PortfolioEntry[])
- engine: `computeValuation`, `computeRecommendation`, `computeComparability`

## Routes (exact, from spec §8)

| Route | Owner |
|---|---|
| `/` portfolio dashboard | Track A |
| `/opportunities/atlas` opportunity overview | Track A |
| `/opportunities/atlas/proposal` | Track B |
| `/opportunities/atlas/valuation` | Track B |
| `/comparables` | Track B |
| `/opportunities/atlas/negotiation` | Track C |
| `/opportunities/atlas/audit` | Track C |
| exports (MD/JSON/CSV) live in Track C (button surfaces may be reused by A/B) |
| AI-assistant interface + fixture + feature flags | Track D (cross-cutting) |

## Shared layout & navigation

Track A owns the root layout + nav shell (left nav: Dashboard, Opportunities, Comparables,
Decision Briefs, Audit; top bar: active case, stage, owner, Export). It will be merged first
so B/C/D can rely on it. Tracks B/C/D must NOT redefine the nav; they only add routes + pages.

## File ownership (no two agents edit the same file)

- **Track A:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/opportunities/atlas/page.tsx`,
  `src/components/layout/*` (nav shell), `src/components/portfolio/*`.
- **Track B:** `src/app/opportunities/atlas/proposal/page.tsx`,
  `src/app/opportunities/atlas/valuation/page.tsx`, `src/app/comparables/page.tsx`,
  `src/components/valuation/*`, `src/components/comparables/*`.
- **Track C:** `src/app/opportunities/atlas/negotiation/page.tsx`,
  `src/app/opportunities/atlas/audit/page.tsx`, `src/lib/export/*` (markdown/json/csv
  generators), `src/components/negotiation/*`, `src/components/audit/*`.
- **Track D:** `src/lib/assistant/*` (interface + FixturePartnershipAnalysisAssistant +
  Claude stub), feature-flag env + read helper in `src/lib/flags.ts`, and a small
  `src/components/assistant/ai-label.tsx` (the `AI draft` badge component only).

## Cross-cutting rules

- **AI draft labeling:** any AI-generated content must render an `AI draft` badge (Track D
  supplies the badge component; tracks import `@/components/assistant/ai-label`).
- **Approval status:** negotiation + audit screens show human approval status (approved/awaiting).
- **Deterministic only:** no live AI in the MVP; feature flags default to disabled.
- **Screenshots (checkpoint 2):** each track must produce 1–2 tight, high-res screenshots of
  its primary screen(s) into `docs/screenshots/` and report the paths.

## Acceptance gates every track must pass before reporting done

- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors
- `npm run build` → success
- The seeded numbers from the engine must render (e.g. base CAV 25.2M, gap −5.8M)
- No AI dependency at runtime; flags default false
- Commit on your branch; do NOT push, do NOT merge

## After merge order (orchestrator)

A → B → C → D (each merged to main in sequence; later tracks rebase onto updated main if
needed by re-creating their worktree on the new main, or I will handle conflict resolution).
