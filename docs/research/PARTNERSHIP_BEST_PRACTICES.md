# Research — Partnership Valuation & Operating Best Practices

**Date:** 2026-08-03
**Scope:** How leading consulting firms (McKinsey, Bain, BCG, Big 4) and big tech
(Microsoft, Google/Alphabet, Apple, Amazon, Nvidia, Meta, Salesforce, Oracle, IBM, SAP,
TSMC) value, structure, and govern strategic partnerships / alliances / ecosystems.
**Purpose:** Gap analysis against the Partnership OS spec (01–06).
**Method:** Web research against authoritative/primary sources; unverified claims are
labeled explicitly.

---

## 1. Canonical frameworks (mapped to the spec)

| Framework | Origin | Core idea | Map to Partnership OS |
|---|---|---|---|
| Alliance Life Cycle (7 phases) | ASAP | Strategy → partner selection → negotiation → operational planning (pilot) → structuring/governance → launch → transform/exit | Matches workflow phases 2–6; **missing phase 1 (build/buy/partner) and phase 7 (exit)** → G-4, G-6 |
| Four principles of complex partnership management | McKinsey (2019) | Clear foundation; nurture relationship; accountability & metrics; willingness to change | Approval gates + assumption register map; **missing per-partnership scorecard** → G-6 |
| Business ecosystems | BCG Henderson Institute | Solution vs transaction ecosystems; monetization must not stifle growth; most ecosystems fail on value-proposition or coordination economics | Validates the "strategic ecosystem" archetype; **missing ecosystem success monitoring** → G-6, G-10 |
| Value creation vs appropriation | Alliance literature (IJMR 2023) | Partners create value jointly; each appropriates a share; can decouple over time | Spec separates GPV (creation) from negotiation brief (appropriation) — **correct architecture** |
| BATNA / ZOPA / reservation value | Fisher & Ury; McKinsey negotiation practice | Anchors, concessions, non-price value trading | Spec's opening/target/reservation/walk-away is textbook-correct; **missing counterparty ZOPA** → G-9 |
| TCO | Gartner | Direct + indirect + operational cost over lifecycle | Implementation cost present; **no discount rate / time value** → G-2 |
| Real options | Trigeorgis; Dixit & Pindyck; Deloitte ASAP | Staged investment; option to expand/abandon/wait has value | Atlas "pilot" recommendation = correct real-option staging; **renewal option not priced as option** → G-10 |
| Break-up / exit economics | M&A + ASAP phase 7 | Termination fees, data return/deletion, IP reversion, transition services | **No exit/break-up cost term** → G-4 |
| Alliance scorecards | Kaplan, Norton & Ruekert (HBR 2008); Deloitte | KPI registry, governance cadence, strategy maps | **No post-signing scorecard object** → G-6 |
| AI partnership deal terms | FTC 6(b); CMA; Stanford; Warren/Wyden | Training vs inference rights, outputs, feedback data, exclusivity, MFN, board/veto, compute credits | `dataRights`/`productRights` are free-text → **G-1 structured taxonomy**; **no regulatory screening** → G-3 |
| Big-tech ecosystem programs | AWS/Microsoft/Google docs; Nvidia GTC | Marketplace fees (AWS ~3%/3.5%/1.5% co-sell), tiered partner networks, Nvidia co-investment in rivals | Provides direct inputs for "distribution value" and cash-flow modeling; Nvidia = live equity/co-investment example → G-7 |

---

## 2. Gap analysis (ranked by importance for AI data and product partnerships)

| # | Gap | Detail | Spec sections affected |
|---|-----|--------|------------------------|
| **G-1** | No structured IP / data-rights model | `dataRights`/`productRights` free-text. Missing: training vs inference use, output/model-weight rights, feedback data, retention/deletion, sublicensing, data export. #1 legal/commercial issue in real AI data deals (FTC 6(b); CMA web-of-90). | 01 §7, 02 ProposalTerms, 05 diligence |
| **G-2** | No discounting / time value of money | Multi-year sums undiscounted; no NPV/IRR, hurdle rate, terminal value. 3-yr $6M/yr treated as $18M. | 01 §8, 02 formulas, 05 |
| **G-3** | No antitrust / regulatory screening | `legal` risk exists but no HSR/merger-control trigger, no exclusivity+preferential-access flag, no EU AI Act / data-export / foreign-investment flags. | 01 §7, 02 RiskItem |
| **G-4** | No break-up / exit / wind-down cost term | Stack lacks termination-fee, data-return/deletion, IP reversion, transition services. Termination rights text-only. | 01 §8, 02 Scenario, 05 |
| **G-5** | Exclusivity under-modeled | One enum + one lumped cost; no option value of foreclosed alternatives, no MFN/carve-outs/segments-and-milestones. Atlas "material option cost" cannot be computed. | 01 §8, 02 ProposalTerms/Scenario |
| **G-6** | No post-signing scorecard / governance cadence | Lifecycle ends at realized-value tracking; missing KPI registry, joint committee, escalation, QBR cadence, exit triggers. | 03 workflow, 02 data model |
| **G-7** | No equity / co-investment / compute-credits structure | Five archetypes all contractual; dominant AI-industry structures blend equity, compute credits, board/veto rights. | 01 §6, 02 ProposalTerms |
| **G-8** | Confidence factor double-counts risk; uncalibrated | ERC = Σ P×impact deducted, then GPV×CF; no scenario probabilities, so CAV is not a true expected value. | 02 §2–3, 01 §8 |
| **G-9** | Negotiation ignores counterparty ZOPA/BATNA & portfolio context | Walk-away set only against the deal's own CAV, not partner's reservation, competitive alternatives, or pipeline marginal bar. | 01 §10, 04 |
| **G-10** | Option/renewal value not priced as an option | Renewal is a probability; pilots' information value and renewal option strike/volatility not priced; SOV not decomposed. | 01 §8, 02, 05 |
| G-11 | Brand / ecosystem value listed but not in the equation | 01 §2 lists it; the equation omits it. | 01 §2 vs §8 |
| G-12 | No partner dependency / single-point-of-failure score | Concentration cost is deal-level; no per-partner dependency (revenue share, key-person, portability, escrow, SLA). | 02 RiskItem, 01 §7 |
| G-13 | No non-compete / poaching / non-solicit terms | Common in data/product partnerships; absent. | 01 §7, 02 |
| G-14 | No warranties / indemnities / liability caps / audit clauses | Termination captured; warranty/indemnity/usage-audit missing. | 01 §7, 02, 05 |
| G-15 | Comparable recency decay & deal-structure type missing | `announcementDate` exists but no recency weighting; no deal-structure field (license vs equity vs rev-share). | 02 ComparableTransaction |
| G-16 | No value-distribution / split modeling | Creation (GPV) vs appropriation (ours) modeled; no "if it creates $35M, what split does each structure imply?" view. | 01 §10, 04 |

---

## 3. What the spec already gets right (do not change)

1. Assumption register + evidence-linked comparables — matches ASAP diligence + source policy discipline.
2. Staged pilots as information-generating devices — real-options / Deloitte / ASAP phase-4 practice.
3. GPV as creation, negotiation brief as appropriation — correct analytic architecture.
4. Opening / target / reservation / walk-away — textbook Fisher–Ury / McKinsey.
5. Give/get matrix with economic + strategic + risk effects — integrative-negotiation best practice.
6. Human approval gates + AI-draft labeling + audit trail — Deloitte governance + McKinsey accountability.
7. Red-team challenge pass — devil's-advocacy; add the ERC×CF double-count item (G-8).
8. Confidence factor shown with components; ranges over point estimates.
9. Comparable normalization as first-class object — the core thesis.
10. Benchmark library / learning loop — ASAP "transform," McKinsey "partners of choice."
11. Portfolio dashboard with concentration and decision dates.
12. No false precision; synthetic labeling; no confidential data.

---

## 4. Top 10 highest-value additions

| # | Add | Why | Support | MVP sketch |
|---|-----|-----|---------|-----------|
| 1 | Structured IP/data-rights taxonomy | Determinative term in AI data deals; regulators probing it | FTC 6(b) inquiries; standard licensing practice | Typed `DataRights` + per-right scope enum + diligence checklist |
| 2 | Discount rate & NPV/IRR per scenario | Stops undiscounted-sum error | Deloitte Valuation & Modelling; DCF | `discountRate` assumption; NPV per scenario; nominal column kept |
| 3 | Regulatory/antitrust screening checklist | Live material risk; shows GC thinking | FTC 6(b); CMA; Warren/Wyden | `regulatory` category in RiskItem + canned flags |
| 4 | Break-up/exit cost term + termination playbook | Complete the value stack | ASAP phase 7; M&A practice | `exitCostUsd` line per scenario |
| 5 | Exclusivity as a priced option | Actually compute "material option cost" | MFN licensing; BCG; antitrust | `exclusivity` struct; EOC driven from it; sensitivity |
| 6 | Post-signing alliance scorecard + governance cadence | Lifecycle stops at signing today | Kaplan–Norton; Deloitte #5 | `Scorecard` entity; `active` stage tools |
| 7 | Equity / compute-credits / co-investment structure type | Captures real AI deal shapes | Public hyperscaler-to-AI-lab investment and compute-credit deals | `structureType` field; one demo comparable |
| 8 | Scenario probabilities + confidence calibration (fix ERC×CF) | CAV should be defensible EV | Decision analysis | P(up/base/down); probability-weighted EV; log calibration |
| 9 | Counterparty ZOPA/BATNA + portfolio-relative walk-away | Show the zone, not just our line | Fisher–Ury; McKinsey | Partner-alternatives fields; ZOPA visualization |
| 10 | Value-split / appropriation view | Headline negotiation question | IJMR 2023 | Split table per scenario × structure |

---

## 5. Sources

**Primary / directly fetched**
- Deloitte CH, "Five success factors to harvest value from strategic alliances" — https://www.deloitte.com/ch/en/services/consulting-financial/research/5-success-factors-strategic-alliances.html
- ASAP, "Alliance Life Cycle" — https://www.strategic-alliances.org/alliance-lifecycle
- FTC, "Staff Report on AI Partnerships & Investments Study" (Jan 2025) — https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-issues-staff-report-ai-partnerships-investments-study
- AWS Marketplace listing fees — https://docs.aws.amazon.com/marketplace/latest/userguide/listing-fees.html
- McKinsey, "Improving the management of complex business partnerships" — https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights/improving-the-management-of-complex-business-partnerships
- Microsoft partner incentives — https://partner.microsoft.com/en-us/partnership/partner-incentives

**Verified via search snippets (secondary/partial)**
- BCG Henderson Institute ecosystem work (Pidun/Reeves); *Business Ecosystems* (De Gruyter 2023)
- IJMR, "Explaining the interplay of value creation and value appropriation in strategic alliances" (2023)
- Kaplan, Norton & Ruekert, "Managing Alliances with the Scorecard" (HBR 2008)
- Stanford Law, "AI Partnerships Beyond Control" (2025); Warren/Wyden letters (Apr 2025); Lexology CMA review
- Nvidia AI-factory GTC coverage (datacenterfrontier, siliconangle)

**Unverified / flagged**
- Exact Microsoft marketplace fee % (secondary only); Salesforce AppExchange economics; Nvidia "$27B invested" figure; "40–50% of alliances fail" statistic; Bain's alliance-valuation methods are not publicly documented.
