# Research — Open-Source Landscape: Partnership / Deal / Valuation Tools

**Date:** 2026-08-03
**Scope:** Public-repo search for existing open-source projects that value, negotiate, or
operationalize partnerships / deals / transactions — the same or substantially overlapping
function as Partnership OS.
**Method:** ~60 GitHub API + web-UI search queries (names, descriptions, READMEs, topics),
npm registry, and the known agent-skill repos. GitLab/Gitea not systematically searchable
without auth; GitHub surface is representative given the niche.

---

## 1. Found projects (shortlist, spam-filtered)

| Project | URL | Stars | License | Stack | Verdict |
|---|---|---|---|---|---|
| ishaanpthegoat/precedent | github.com/ishaanpthegoat/precedent | 0 | none | TS / Next.js 14 | High on comps library; none on partnership value |
| recoupable/recoup-catalogs-plugin | github.com/recoupable/recoup-catalogs-plugin | 1 | Apache-2.0 | Python (Claude plugin) | High on workflow; none on asset class |
| sashalascar-laurel/partnerships-os | github.com/sashalascar-laurel/partnerships-os | 3 | none | Markdown/Dust | Partial (partnership "OS", no valuation) |
| JiwaniZakir/Partnerships_OS | github.com/JiwaniZakir/Partnerships_OS | 0 | MIT | TS/Neo4j | Partial (CRM, no valuation) |
| gpasmurta/partnerships-os-claude-skills | github.com/gpasmurta/partnerships-os-claude-skills | 0 | none | Claude skills | Partial (BD workstream, no valuation) |
| zshqv/PitchOS | github.com/zshqv/PitchOS | 2 | MIT | Python | Partial (M&A brief PDF, no partnership economics) |
| tdavidson/reporting | github.com/tdavidson/reporting | 43 | Apache-2.0 | TS / Next.js | Partial (VC decision-memo workflow) |
| zoharbabin/due-diligence-agents | github.com/zoharbabin/due-diligence-agents | 76 | Apache-2.0 | Python | Partial (source-cited multi-agent DD) |
| glebourd/negotiation-coach-skill | github.com/glebourd/negotiation-coach-skill | 1 | MIT | Claude skill | Partial (negotiation-prep logic) |
| dungnotnull/negotiation-strategy-coach | github.com/dungnotnull/negotiation-strategy-coach-agent-skill | 3 | MIT | Python | Partial (BATNA scoring + devil's-advocate gate) |
| silkyrex/corp-dev-copilot | github.com/silkyrex/corp-dev-copilot | 0 | MIT | Claude skill | Partial (term-sheet extraction/diligence) |
| bigjoecoding/smb-acquisition-diligence | github.com/bigjoecoding/smb-acquisition-diligence | 1 | none | Claude skill | Partial (SDE normalization) |
| manus-team-skills/company-valuation | github.com/manus-team-skills/company-valuation | 0 | none | Python + XLSX | Partial (comps/DCF skill) |
| emilepetrone/solosearcher-prompts | github.com/emilepetrone/solosearcher-prompts | 23 | none | Prompt pack | Partial (diligence/valuation/risk prompts) |
| nickcals/multiples | github.com/nickcals/multiples | 3 | CC-BY-4.0 | Dataset | Partial — real SMB multiples dataset |
| mariourquia/cre-skills-plugin | github.com/mariourquia/cre-skills-plugin | 42 | NOASSERTION | Python/Claude plugin | Partial (100+ CRE deal skills) |
| EQTPartners/sire | github.com/EQTPartners/sire | 39 | MIT | Python | Partial (confidence-estimate extrapolation) |
| OctagonAI/octagon-vc-agents | github.com/OctagonAI/octagon-vc-agents | 30 | MIT | Python MCP | Partial (VC term-sheet negotiation) |
| matthewjflanagan/negotiation-worksheet | github.com/matthewjflanagan/negotiation-worksheet | 1 | none | React | Partial (opening calc / BATNA / concessions) |
| beingsmit/technical-product-gtm | github.com/beingsmit/technical-product-gtm | 40 | MIT | Claude skills | Partial (partnership-architecture GTM skill) |
| fatihguner/foreman | github.com/fatihguner/foreman | 42 | MIT | Claude plugin | Partial (generalized strategy advisor) |
| wafflebytes/DealDesk-Tambo | github.com/wafflebytes/DealDesk-Tambo | 7 | none | TS / Next.js | Partial (AI contract workspace) |
| @absolutejs/partnership (npm) | npmjs.com/package/@absolutejs/partnership | — | unverified | JS lib | Partial (AI partnership-lifecycle primitives) |

**Agent-skill repos checked:** a first-party vendor skills collection (166k★) — zero deal/negotiation/
valuation/partnership skills. `deanpeters/Product-Manager-Skills` (6.2k★) — none; nearest
are `autonomous-investigation` (Fact/Inference/Assumption labels), `derisk-measurement-advisor`,
`battle-card-builder`. `RefoundAI/lenny-skills` (1.2k★, MIT) — `high-stakes-decisions`,
`negotiating-compensation`, `evaluating-trade-offs`; nothing partnership-specific.

---

## 2. Direct competitors (closest overlap)

**There is no open-source project building the same product.** Closest:

1. **ishaanpthegoat/precedent** — institutional-grade M&A comparable-transactions platform.
   Overlap: comp library, normalization, defensible sets, source-per-number. Difference: values
   *equity* via multiples/DCF; no partnership archetypes, no value-stack, no confidence factor,
   no scenario engine, no negotiation brief, no approval gates, no benchmark feedback.
2. **recoupable/recoup-catalogs-plugin** — Claude plugin: data room → source-cited deal package
   (normalize → value → memos → HTML dashboard). Closest structural workflow match. Difference:
   music catalogs; agent skill not local-first app; no negotiation brief, no scenario
   confidence-adjustment.
3. **Negotiation coach skills** (glebourd, dungnotnull) — cover BATNA, reservation, ZOPA,
   MESO, concession ladders, devil's-advocate gate. Difference: standalone coaches, not wired
   to a valuation model; no give/get from scenario economics.
4. **tdavidson/reporting** — AI-native VC platform (Apache-2.0, Next.js): screening, DD,
   memo drafting, KPIs. Difference: equity/VC; narrative memo not computed value range; no
   comparable-normalization engine; AI central rather than disabled-by-default-with-fixtures.

The "partnership OS" named repos (sashalascar, JiwaniZakir, gpasmurta, vwongyt, huuphat) are
all partnership *relationship/tracking* systems (second brains, CRMs, funnels). None compute
value; none do negotiation strategy.

---

## 3. Adjacent building blocks worth borrowing

| Block | Source | License | What to take |
|---|---|---|---|
| Multiples dataset | nickcals/multiples | CC-BY-4.0 | Real median multiples to anchor comp library (attribution required) |
| Comp platform architecture | precedent | none (inspect) | Filter/comparability-score UI, finance-engine separation |
| Source-cited deal package | recoup-catalogs-plugin | Apache-2.0 | Normalize→value→memo pipeline, workpapers, agent-output labeling |
| Negotiation logic | glebourd / dungnotnull | MIT | BATNA/ZOPA/reservation/aspiration, MESO, concession ladders, quality gate |
| Term-sheet extraction | corp-dev-copilot | MIT | Standard/non-standard/missing business-term pull |
| Citation discipline | due-diligence-agents | Apache-2.0 | Page+quote citations at engine scale |
| Confidence estimation | EQTPartners/sire | MIT | Confidence bands on scarce data (informs CF 0.40–0.95) |
| Decision cards + approvals | deal-desk-workspace | none | Decision-card schema with versions + approval states |

---

## 4. Novelty verdict

**The full combination is not built as an open-source app.** Partnership OS is differentiated
on *integration and domain*, not any single component:

- **Sparse-comparable partnership valuation** (archetype-weighted comparability + value-stack +
  scenario + confidence-adjustment) is unbuilt in OSS; everything in the comp space values
  equity via multiples/DCF.
- **Negotiation brief wired to the valuation** (opening/target/reservation/walk-away computed
  from confidence-adjusted scenario output + give/get matrix) is not implemented anywhere found.
- **Human-gated AI with deterministic fallback + benchmark-library feedback** — no OSS deal
  tool ships AI behind disabled-by-default flags with a full fixture path and a post-deal audit
  loop updating the comp library.

**Honest caveats:** every ingredient is well-understood practice (IB comps, scenario planning,
Fisher–Ury/Raiffa negotiation, decision records). The novelty is the *pipeline* and *operating
model*, not the underlying math. Commercially, closed-source partnership-ecosystem platforms
(Crossbeam, Reveal, PartnerStack, Alliance) do co-sell/attribution, not valuation — the white
space is real but also unvalidated by demand.

---

## 5. Top 5 repos worth inspecting

1. **ishaanpthegoat/precedent** — comparable-library product surface + clean finance-engine/UI
   separation (Screens C/D reference architecture). License: none → inspect, don't copy.
2. **recoupable/recoup-catalogs-plugin** — end-to-end source-cited deal-package workflow and
   "AI assists, humans approve, everything sourced" pattern. Apache-2.0.
3. **nickcals/multiples** — real median-multiple anchors + normalization/source-labeling
   schema. CC-BY-4.0.
4. **glebourd/negotiation-coach-skill** (+ dungnotnull) — negotiation-preparation taxonomy and
   devil's-advocate gate (Screen E + red-team). MIT.
5. **tdavidson/reporting** — Next.js AI-assisted decision documents with audit-conscious
   workflow (decision-room/audit-trail UX). Apache-2.0.

**Flags / unverified:** GitLab/Gitea not searched; `@absolutejs/partnership` license/maturity
unverified; several 0–1★ repos are likely recent AI-generated portfolio projects — treat
claims cautiously.
