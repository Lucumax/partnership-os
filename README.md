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
Playwright. Local JSON fixtures; optional AI-assistant interface is disabled by default and
requires feature flags + credentials.

## Status

Phase 0 scaffold complete. See `docs/VALUATION_RECONCILIATION.md` for the seeded-case math.

## Roadmap

MVP v1.0 shipped (walkthrough-ready): see [`ROADMAP.md`](ROADMAP.md) for what's delivered,
what's deferred to v1.1, and the future direction. Screenshots of all six primary screens
live in [`docs/screenshots/`](docs/screenshots/).
