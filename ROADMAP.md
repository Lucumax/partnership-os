# Partnership OS — Roadmap

Status: **MVP v1.0 shipped (walkthrough-ready).** This roadmap records what the MVP delivers,
what was deliberately deferred, and the future direction. The MVP is a portfolio proof-of-work
for a senior Strategy & Operations / Product Partnerships role — an internal-tool-fidelity
app, not a public SaaS.

---

## What the MVP (v1.0) delivers

A local-first decision-support app that converts an inbound partnership proposal into:

1. a structured term sheet;
2. an explicit assumption register;
3. a normalized comparable set;
4. a scenario-based valuation range (downside / base / upside);
5. a negotiation brief;
6. a human-approved decision record;
7. an auditable history.

### Shipped features

| Area | What's in v1.0 |
|---|---|
| Portfolio dashboard | Six-case portfolio (Atlas modeled end-to-end; five portfolio-level entries): KPIs (pipeline value, CAV, spend, decisions due), stage funnel, value-vs-spend scatter, concentration by archetype, upcoming decisions, recent assumption changes |
| Opportunities index | `/opportunities` portfolio table — stage, proposed cost, CAV, gap per case (added in round 1) |
| Opportunity overview | Summary, proposed economics, recommendation, value range, top sensitivities, confidence score, open questions, risks, approval status |
| Proposal intake | Two-column structured form over the typed `ProposalTerms`; regulatory flags (G-3); diligence questions |
| Valuation workbench | Live-recompute scenario cards (gross/CAV/ROI/payback/gap), base-case waterfall, editable assumption table, top-5 sensitivities (±10%), red-team flags, confidence-factor breakdown, NPV of cash cost (G-2) |
| Comparable library | Filterable table, archetype-weighted comparability score, normalization factors, recency decay (G-15), synthetic labels |
| Negotiation brief | Opening / target / reservation / walk-away, give/get matrix, red lines, missing evidence, partner questions, change conditions, AI-draft labels, approval toggle |
| Audit & decision history | Event timeline (actor/timestamp/rationale), human approval gate, 7-question explainability block |
| Exports | Markdown decision memo, JSON full case, CSV comparables, browser downloads |
| AI-assistant layer | `PartnershipAnalysisAssistant` interface + deterministic fixture implementation; live Claude stub behind disabled-by-default flags; `AI draft` labeling |
| Deterministic engine | GPV / CAV / ROI / ERC / comparability / confidence-factor / NPV formulas; 75 unit tests; seeded reconciliation matches the spec exactly |
| Accessibility baseline | WCAG 2.2 AA baseline (round 2): one h1 per route, ordered heading outline, landmarks, visible keyboard focus, named tables and charts, contrast fixes, automated Playwright assertions |

**Partially delivered:** the multi-opportunity portfolio ships as a portfolio-level shell
(six cases; one modeled end-to-end, five portfolio-level entries). Deep per-case modeling
of the additional cases is still future work.

### Engineering quality gates (all green)

- `npx tsc --noEmit` → 0 errors (TypeScript strict)
- `npm run lint` → 0 errors
- `npx vitest run` → 75 tests pass
- `npm run build` → success (10 static routes)
- `npx playwright test` → 12 e2e tests pass (demo path + exports + QA render/no-console-error + theme + responsive + accessibility baseline)
- Clean install verified (fresh clone → install → build → tests)
- Secret scan clean; no env/pem/credential files tracked

---

## Deliberately deferred from v1.0 (backlog)

Full details in `docs/backlog/V1.1_BACKLOG.md`. These were identified in the research pass
(`docs/research/PARTNERSHIP_BEST_PRACTICES.md`) as real gaps but are Medium-cost and were
out of MVP scope. **The MVP includes the cheap/bounded subset** (G-1 typed data-rights,
G-2 NPV, G-3 regulatory screening, G-4 exit cost, G-11 brand value, G-15 recency).

| # | Item | Status |
|---|---|---|
| G-5 | Exclusivity as a priced option (segments, duration, carve-outs, MFN) | v1.1 |
| G-6 | Post-signing alliance scorecard & governance cadence | v1.1 |
| G-7 | Equity / compute-credits / co-investment structure type | v1.1 |
| G-8 | Scenario probabilities + confidence calibration (fix ERC×CF double count) | v1.1 |
| G-9 | Counterparty ZOPA/BATNA + portfolio-relative walk-away | v1.1 |
| G-10 | Option / renewal value priced as an option | v1.1 |
| G-12 | Partner dependency / single-point-of-failure score | v1.1 |
| G-13 | Non-compete / poaching / non-solicit terms | v1.1 |
| G-14 | Warranties / indemnities / liability caps / audit clauses | v1.1 |
| G-16 | Value-distribution / split modeling (ours vs partner) | v1.1 |

---

## Future roadmap

### v1.1 — Partnership depth (the deferred gaps)

- Priced exclusivity (segments, milestones, MFN, carve-outs) driving `exclusivityOpportunityCostUsd`.
- Post-signing `Scorecard` entity (KPIs, targets, review cadence, exit triggers) + `active` stage tooling.
- Equity / compute-credits / co-investment `structureType` with a demo comparable.
- Scenario probabilities (25/50/25) → probability-weighted expected value; fix the ERC×CF double count.
- Counterparty ZOPA/BATNA estimation + walk-away relative to the pipeline marginal bar.
- Renewal valued as a real option; SOV decomposed (expand/abandon/wait).
- Value-split view: "if it creates $35M, what does each structure imply for us vs partner?"

### v1.2 — Persistence & collaboration

- Repository adapter behind the existing interfaces (SQLite or a Supabase adapter); replace
  in-memory fixtures with a seeded database.
- Lightweight review flow: comments on artifacts, async approval, reviewer fields.
- Decision-log versioning (diff an assumption change → show the recommendation change).

### v1.3 — Live AI with governance

- Implement the real Claude assistant behind the existing interface + feature flags, with
  per-block source records, model id, and human approval before any position becomes final.
- Red-team pass as a separate critic (different model), returning ranked findings that must be
  acknowledged before approval.
- AI output evaluation harness (blinded comparison vs fixture baseline).

### v1.4+ — Operating system

- Public web deployment (no auth in MVP; auth when it stops being a portfolio demo).
- Cross-deal benchmarking: realized-value tracking updates the comparable library.
- Enterprise integrations (CRM / contract management) as exports/imports, not live sync.
- Audit-trail attestation for regulated use. (A WCAG 2.2 AA baseline shipped in round 2; a formal audit and full compliance pass remain future work.)

---

## Operating principles (kept from the spec)

- **Decision first.** Every screen moves proposal → decision.
- **Assumptions visible.** No important conclusion depends on a hidden assumption.
- **Ranges over false precision.** Scenarios + confidence bands.
- **Evidence linked.** Every comparable and material claim points to a source or is labeled synthetic.
- **Human judgment retained.** AI drafts and challenges; humans approve.
- **Action and outcome separated.** Record who did what versus what later happened.
- **Reusable system.** Each completed case improves the benchmark library.
- **No confidential implication.** All demo data is fictional or public.

## Non-goals (unchanged)

No production authentication, no live CRM/contract/finance integrations, no real contract
ingestion, no autonomous approval or negotiation, no real Anthropic deal data.
