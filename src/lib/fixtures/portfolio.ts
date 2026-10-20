import {
  ATLAS_OPPORTUNITY,
  ATLAS_PROPOSAL,
  ATLAS_SCENARIO_INPUTS,
} from "@/lib/fixtures/atlas";
import { computeValuation } from "@/lib/valuation/engine";
import type { Archetype, OpportunityStage } from "@/lib/domain/types";

/**
 * Lightweight portfolio-level row. Deliberately NOT a full `Opportunity`: only the
 * modeled case (Atlas) carries proposal/assumptions/scenarios/risks/approvals/audit
 * events. The supporting entries exist to populate portfolio-level views, nothing more.
 */
export interface PortfolioEntry {
  id: string;
  name: string;
  partnerAlias: string;
  archetype: Archetype;
  stage: OpportunityStage;
  owner: string;
  decisionDate?: string; // ISO
  grossValueUsd: number; // base-case gross partnership value
  confidenceAdjustedValueUsd: number;
  economicCostUsd: number;
  highRisk: boolean; // has a high/critical risk
  modeled: boolean; // true only for Atlas — the fully modeled case
  href?: string; // drill-through target; only set when modeled
}

const ATLAS_VALUATION = computeValuation({
  proposal: ATLAS_PROPOSAL,
  scenarios: ATLAS_SCENARIO_INPUTS,
});
const ATLAS_BASE = ATLAS_VALUATION.byName.base;

/**
 * The Atlas entry is derived from the engine, never hardcoded, so the dashboard can
 * not drift from the reconciled valuation.
 */
export const ATLAS_PORTFOLIO_ENTRY: PortfolioEntry = {
  id: ATLAS_OPPORTUNITY.id,
  name: ATLAS_OPPORTUNITY.name,
  partnerAlias: ATLAS_OPPORTUNITY.partnerAlias,
  archetype: ATLAS_OPPORTUNITY.archetype,
  stage: ATLAS_OPPORTUNITY.stage,
  owner: ATLAS_OPPORTUNITY.owner,
  decisionDate: ATLAS_OPPORTUNITY.decisionDate,
  grossValueUsd: ATLAS_BASE.grossPartnershipValueUsd,
  confidenceAdjustedValueUsd: ATLAS_BASE.confidenceAdjustedValueUsd,
  economicCostUsd: ATLAS_VALUATION.totalEconomicCostUsd,
  highRisk: ATLAS_OPPORTUNITY.risks.some(
    (risk) => risk.severity === "high" || risk.severity === "critical",
  ),
  modeled: true,
  href: "/opportunities/atlas",
};

/**
 * Nine fictional supporting cases, shaped like a real pipeline rather than one case
 * per stage: mass in the early stages (inbound, diligence), thinning through
 * negotiation and approval, with one case active and one declined. All numbers are
 * synthetic and invented — no real company names, no real deal data. Each is
 * CAV < gross (CAV is risk-discounted), and together they land on both sides of the
 * value = spend line so the scatter and concentration charts carry real signal.
 * Dates are set relative to the fixed ATLAS_ANALYSIS_DATE (2026-07-30), so at least
 * two decisions fall 8–25 days out.
 *
 * Stage shape (Atlas sits in "valuation"): inbound 3, diligence 2, valuation 1,
 * negotiation 1, approval 1, contracting 0, active 1, declined 1 — 10 cases total.
 * This is deliberate: it lets "Pipeline value by stage" show that a single
 * negotiation-stage case can carry more confidence-adjusted value than several
 * early-stage cases combined, which a flat one-per-stage count chart cannot.
 */
const SUPPORTING_ENTRIES: PortfolioEntry[] = [
  {
    id: "halcyon-corpus-license",
    name: "Halcyon Corpus License",
    partnerAlias: "Halcyon",
    archetype: "data_licensing",
    stage: "inbound",
    owner: "strategy.ops.lead",
    grossValueUsd: 6.0,
    confidenceAdjustedValueUsd: 4.2,
    economicCostUsd: 2.5,
    highRisk: false,
    modeled: false,
  },
  {
    id: "solstice-data-exchange",
    name: "Solstice Data Exchange",
    partnerAlias: "Solstice",
    archetype: "data_licensing",
    stage: "inbound",
    owner: "strategy.ops.lead",
    grossValueUsd: 5.0,
    confidenceAdjustedValueUsd: 3.2,
    economicCostUsd: 2.0,
    highRisk: false,
    modeled: false,
  },
  {
    id: "meridian-integration-bridge",
    name: "Meridian Integration Bridge",
    partnerAlias: "Meridian",
    archetype: "product_integration",
    stage: "inbound",
    owner: "research.stakeholder",
    grossValueUsd: 8.0,
    confidenceAdjustedValueUsd: 5.0,
    economicCostUsd: 4.0,
    highRisk: false,
    modeled: false,
  },
  {
    id: "vantage-api-partnership",
    name: "Vantage API Partnership",
    partnerAlias: "Vantage",
    archetype: "product_integration",
    stage: "diligence",
    owner: "research.stakeholder",
    decisionDate: "2026-08-21T00:00:00Z",
    grossValueUsd: 18.0,
    confidenceAdjustedValueUsd: 9.3,
    economicCostUsd: 9.5,
    highRisk: false,
    modeled: false,
  },
  {
    id: "beacon-distribution-network",
    name: "Beacon Distribution Network",
    partnerAlias: "Beacon",
    archetype: "distribution",
    stage: "diligence",
    owner: "deal.lead",
    grossValueUsd: 14.0,
    confidenceAdjustedValueUsd: 8.0,
    economicCostUsd: 7.5,
    highRisk: false,
    modeled: false,
  },
  {
    id: "cascade-channel-alliance",
    name: "Cascade Channel Alliance",
    partnerAlias: "Cascade",
    archetype: "distribution",
    stage: "negotiation",
    owner: "deal.lead",
    decisionDate: "2026-08-18T00:00:00Z",
    grossValueUsd: 44.0,
    confidenceAdjustedValueUsd: 28.5,
    economicCostUsd: 20.0,
    highRisk: true,
    modeled: false,
  },
  {
    id: "ridgeline-ecosystem-compact",
    name: "Ridgeline Ecosystem Compact",
    partnerAlias: "Ridgeline",
    archetype: "strategic_ecosystem",
    stage: "approval",
    owner: "delivery.lead",
    decisionDate: "2026-08-24T00:00:00Z",
    grossValueUsd: 30.0,
    confidenceAdjustedValueUsd: 19.0,
    economicCostUsd: 16.0,
    highRisk: true,
    modeled: false,
  },
  {
    id: "pinnacle-ecosystem-alliance",
    name: "Pinnacle Ecosystem Alliance",
    partnerAlias: "Pinnacle",
    archetype: "strategic_ecosystem",
    stage: "active",
    owner: "delivery.lead",
    grossValueUsd: 22.0,
    confidenceAdjustedValueUsd: 14.0,
    economicCostUsd: 10.0,
    highRisk: false,
    modeled: false,
  },
  {
    id: "apex-corpus-license",
    name: "Apex Corpus License",
    partnerAlias: "Apex",
    archetype: "data_licensing",
    stage: "declined",
    owner: "strategy.ops.lead",
    grossValueUsd: 11.0,
    confidenceAdjustedValueUsd: 3.8,
    economicCostUsd: 9.0,
    highRisk: false,
    modeled: false,
  },
];

export const PORTFOLIO_ENTRIES: PortfolioEntry[] = [
  ATLAS_PORTFOLIO_ENTRY,
  ...SUPPORTING_ENTRIES,
];
