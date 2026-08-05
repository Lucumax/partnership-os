# Partnership OS

**Defensible partnership decisions when comparables are sparse.**

A portfolio-quality MVP: a local-first decision-support application for valuing, negotiating,
and operationalizing novel data and product partnerships when comparable transactions are
incomplete, structures are non-standard, and multiple teams need a common analytical view.

## What it does

Converts an inbound proposal into:

1. a structured term sheet;
2. an explicit assumption register;
3. a normalized comparable set;
4. a scenario-based valuation range;
5. a negotiation brief;
6. a human-approved decision record;
7. an auditable history that updates the benchmark library.

## Build contract

The full specification package lives in [`spec/`](spec/) and is the build contract:

- `01_PRODUCT_SPEC.md` — product objective, scope, screens, technical architecture
- `02_DATA_MODEL.md` — core entities, schemas, formulas, evidence model
- `03_WORKFLOWS_AND_AI.md` — human/AI workflow, approval gates, traceability
- `04_UI_WIREFRAME.md` — page-by-page layout and interaction notes
- `05_SYNTHETIC_DEMO_DATA.md` — fictional partnership case and starter values
- `06_ACCEPTANCE_CRITERIA.md` — release gates and demo script
- `07_GAMMA_FIRST_LOOK_PROMPT.md` — prompt for a 9-slide Gamma concept deck
- `08_BUILD_PROMPT_V4_FLASH.md` — implementation prompt for a coding agent

## Stack

Next.js 16 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Recharts, Zod, Vitest,
Playwright. Local JSON fixtures; every route is statically prerendered at build time.

The app includes a typed `PartnershipAnalysisAssistant` interface and a deterministic
fixture implementation that drives the `AI draft` labels in the UI. The live (Claude)
implementation is a **typed stub**: even when the feature flags and an API key are
configured, its methods throw `NOT_IMPLEMENTED`, and no page or component calls
`getAssistant()` at all. Live AI is a deliberate demo boundary, not a switch that can be
flipped on by setting flags.

## Status

A six-case portfolio on current-dated synthetic fixtures (analysis date 2026-07-30). One
case — Atlas Knowledge Systems — is modeled end-to-end (intake, valuation workbench,
negotiation brief, decision history). The other five populate portfolio-level views only
(the dashboard, the `/opportunities` index, and the portfolio charts); all names and
numbers are fictional. See `docs/VALUATION_RECONCILIATION.md` for the seeded-case math.

## Roadmap

MVP v1.0 shipped (walkthrough-ready): see [`ROADMAP.md`](ROADMAP.md) for what's delivered,
what's deferred to v1.1, and the future direction.

## Screenshots

All seven primary screens, captured at 1440×900 with 2× pixel density against the
production build:

| Screen | File |
|---|---|
| Portfolio dashboard | [`docs/screenshots/01-dashboard.png`](docs/screenshots/01-dashboard.png) |
| Opportunities index | [`docs/screenshots/02-opportunities.png`](docs/screenshots/02-opportunities.png) |
| Atlas opportunity overview | [`docs/screenshots/03-overview.png`](docs/screenshots/03-overview.png) |
| Valuation workbench | [`docs/screenshots/04-valuation.png`](docs/screenshots/04-valuation.png) |
| Comparable library | [`docs/screenshots/05-comparables.png`](docs/screenshots/05-comparables.png) |
| Negotiation brief | [`docs/screenshots/06-negotiation.png`](docs/screenshots/06-negotiation.png) |
| Audit & decision history | [`docs/screenshots/07-audit.png`](docs/screenshots/07-audit.png) |

Regenerate them after UI changes with:

```bash
node scripts/capture-screenshots.mjs
```
