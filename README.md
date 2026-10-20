# Partnership OS

**Defensible partnership decisions when comparables are sparse.**

A local-first decision-support application for valuing, negotiating, and documenting novel
data and product partnerships when comparable transactions are incomplete, structures are
non-standard, and several teams need a common analytical view.

> **Synthetic data only.** Every company, deal term, comparable, and number in this repository
> is fictional and exists to demonstrate the methodology. Nothing here reflects a real
> transaction or a real organization.

## What it does

Takes an inbound partnership proposal through:

1. a structured term sheet;
2. an explicit assumption register;
3. a normalized comparable set;
4. a scenario-based valuation range (downside / base / upside), risk-discounted by a
   confidence factor;
5. a negotiation brief (opening position, target range, reservation value, walk-away);
6. a human-approved decision record;
7. an auditable decision history.

Exports (Markdown, JSON, CSV) are available from the audit and negotiation screens.

## Status

MVP v1.0, built on current-dated synthetic fixtures (analysis date 2026-07-30). The portfolio
holds six fictional cases. One, Atlas Knowledge Systems, is modeled end to end: intake,
valuation workbench, negotiation brief, and decision history. The other five populate the
portfolio-level views only (dashboard, `/opportunities` index, charts). See
[`docs/VALUATION_RECONCILIATION.md`](docs/VALUATION_RECONCILIATION.md) for the seeded-case
math and [`ROADMAP.md`](ROADMAP.md) for what is delivered, deferred, and planned.

## Stack

Next.js 16 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Recharts, Zod, Vitest,
Playwright. Data comes from local JSON/TypeScript fixtures; every route is statically
prerendered at build time. There is no backend and no database.

## Run it

Requires Node.js 22 or newer (the CI workflow uses Node 22).

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run build      # production build
npm run lint
npm run test:e2e   # Playwright end-to-end suite (requires `npx playwright install`)
```

Last verified on a fresh clone: `npm ci`, `npm test` (11 files, 102 unit tests passing),
`npm run build`, and `npm run lint` all succeed. The Playwright suite is not part of CI and
was not re-run for this release.

## AI assistant boundary

The app defines a typed `PartnershipAnalysisAssistant` interface and a deterministic fixture
implementation that drives the "AI draft" labels in the UI. The live LLM implementation is a
**typed stub**: even with feature flags and an API key configured, its methods throw
`NOT_IMPLEMENTED`, and no page or component calls `getAssistant()`. Live AI is a deliberate
boundary, not a switch that can be flipped on by setting environment variables.

## Limits

- Synthetic, hand-seeded data; valuation outputs are illustrations of the method, not
  forecasts or benchmarks.
- No authentication, no live CRM, contract, or finance integrations, no real contract
  ingestion, and no autonomous approval or negotiation.
- No server-side persistence; nothing is stored outside the browser.
- Only one case is modeled end to end.

## Screenshots

Captured at 1440x900 at 2x pixel density against the production build:

| Screen | File |
|---|---|
| Portfolio dashboard | [`docs/screenshots/01-dashboard.png`](docs/screenshots/01-dashboard.png) |
| Opportunities index | [`docs/screenshots/02-opportunities.png`](docs/screenshots/02-opportunities.png) |
| Atlas opportunity overview | [`docs/screenshots/03-overview.png`](docs/screenshots/03-overview.png) |
| Valuation workbench | [`docs/screenshots/04-valuation.png`](docs/screenshots/04-valuation.png) |
| Comparable library | [`docs/screenshots/05-comparables.png`](docs/screenshots/05-comparables.png) |
| Negotiation brief | [`docs/screenshots/06-negotiation.png`](docs/screenshots/06-negotiation.png) |
| Audit and decision history | [`docs/screenshots/07-audit.png`](docs/screenshots/07-audit.png) |

Regenerate them after UI changes with `node scripts/capture-screenshots.mjs`.

## License

MIT. See [`LICENSE`](LICENSE).
