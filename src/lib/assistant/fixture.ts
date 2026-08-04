import { computeRecommendation } from "@/lib/valuation/engine";
import { ATLAS_PROPOSAL } from "@/lib/fixtures/atlas";
import type { ChallengeFinding } from "@/lib/assistant/challenge";
import type { PartnershipAnalysisAssistant } from "@/lib/assistant/types";
import type {
  Opportunity,
  ProposalTerms,
  Recommendation,
  Scenario,
  ScenarioName,
} from "@/lib/domain/types";

export const SYNTHETIC_PROPOSAL_TEXT = `Atlas Knowledge Systems — synthetic term sheet

Term: 36-month data license, API, product-integration, and joint enterprise distribution agreement with limited category exclusivity.
Economics: $4.0M upfront payment; $6.0M annual license fee; $3.0M per-year minimum usage commitment; $1.5M implementation support; total economic consideration of $31.0M.
Structure: joint implementation team and renewal option after year three.
Termination: for cause; convenience after year two with fee.
`;

export const ATLAS_DILIGENCE_QUESTIONS: readonly string[] = [
  "What share of the corpus is unique versus replaceable?",
  "What percentage of the content can be licensed for model and product use?",
  "What evidence supports expected enterprise distribution?",
  "What implementation resources are contractually committed?",
  "How will usage be measured and audited?",
  "What quality, freshness, and rights warranties are provided?",
  "What happens if regulatory or policy requirements change?",
  "Which rights survive termination?",
  "How does exclusivity narrow other strategic options?",
  "What milestone structure would support a pilot?",
];

export const ATLAS_RED_TEAM_FINDINGS: readonly ChallengeFinding[] = [
  {
    id: "challenge-double-counting",
    severity: "high",
    finding:
      "Enterprise distribution revenue is partially double-counted against the API-integration value in the base case.",
    evidenceId: "assumption-distribution-value",
  },
  {
    id: "challenge-unsupported-comparables",
    severity: "high",
    finding:
      "Pioneer Hybrid Agreement is the closest structural comparable but is a single synthetic record with no corroborating public evidence.",
    evidenceId: "cmp-pioneer-hybrid-agreement",
  },
  {
    id: "challenge-hidden-implementation-costs",
    severity: "medium",
    finding:
      "Implementation support is valued at only $1.5M against a seven-month integration estimate and a joint implementation team.",
    evidenceId: "assumption-integration-months",
  },
  {
    id: "challenge-optimistic-adoption",
    severity: "high",
    finding:
      "The upside case assumes 110% of plan adoption before any distribution evidence exists.",
    evidenceId: "assumption-adoption-rate",
  },
  {
    id: "challenge-weak-renewal",
    severity: "medium",
    finding:
      "Base-case renewal probability of 60% is a low-confidence judgment that drives a material share of the upside value.",
    evidenceId: "assumption-renewal-probability",
  },
  {
    id: "challenge-exclusivity-omitted",
    severity: "high",
    finding:
      "Limited category exclusivity carries a real option cost that the $3.0M exclusivity opportunity cost is likely to understate.",
  },
  {
    id: "challenge-concentration",
    severity: "medium",
    finding:
      "Value concentrates in a single partner relationship; a key-person dependency is recorded but not priced into the recommendation.",
  },
  {
    id: "challenge-false-precision",
    severity: "low",
    finding:
      "Recommendation positions are reported to one decimal in $M despite wide scenario uncertainty.",
  },
  {
    id: "challenge-claim-vs-evidence",
    severity: "high",
    finding:
      "Atlas's stated distribution reach is treated as a value driver without an evidence record that separates partner claims from verified facts.",
  },
  {
    id: "challenge-confidence-overreach",
    severity: "medium",
    finding:
      "The recommendation treats the base-case gap as decision-grade even though evidence quality and assumption stability are at best medium.",
  },
];

interface TermRule {
  readonly pattern: RegExp;
  readonly apply: (match: RegExpMatchArray) => Partial<ProposalTerms>;
}

const TERM_RULES: readonly TermRule[] = [
  { pattern: /(\d+)-month/i, apply: (match) => ({ termMonths: Number(match[1]) }) },
  { pattern: /\$([\d.]+)\s*M upfront/i, apply: (match) => ({ upfrontCashUsd: Number(match[1]) }) },
  { pattern: /\$([\d.]+)\s*M annual license/i, apply: (match) => ({ annualLicenseFeeUsd: Number(match[1]) }) },
  { pattern: /\$([\d.]+)\s*M per-year minimum usage/i, apply: (match) => ({ annualMinimumUsageUsd: Number(match[1]) }) },
  { pattern: /\$([\d.]+)\s*M implementation support/i, apply: (match) => ({ implementationSupportUsd: Number(match[1]) }) },
  {
    pattern: /\$([\d.]+)\s*M total economic consideration/i,
    apply: (match) => ({ cashConsiderationUsd: Number(match[1]) }),
  },
  { pattern: /full (?:category )?exclusivity/i, apply: () => ({ exclusivity: "full" }) },
  { pattern: /limited category exclusivity/i, apply: () => ({ exclusivity: "limited" }) },
  {
    pattern: /joint enterprise distribution/i,
    apply: () => ({ distributionCommitments: ["Joint enterprise distribution"] }),
  },
  { pattern: /joint implementation team/i, apply: () => ({ implementationObligations: ["Joint implementation team"] }) },
  { pattern: /renewal option after year three/i, apply: () => ({ renewalMechanics: "Two-year renewal option after year three" }) },
  {
    pattern: /for cause;\s*convenience after year two with fee/i,
    apply: () => ({ terminationRights: "For cause; convenience after year two with fee" }),
  },
];

function scenariosByName(context: Opportunity): Record<ScenarioName, Scenario> {
  const index = new Map<ScenarioName, Scenario>();
  for (const scenario of context.scenarios) {
    index.set(scenario.name, scenario);
  }
  const record = {} as Record<ScenarioName, Scenario>;
  for (const name of ["downside", "base", "upside"] as const) {
    const scenario = index.get(name);
    if (!scenario) {
      throw new Error(`Opportunity "${context.id}" is missing the "${name}" scenario`);
    }
    record[name] = scenario;
  }
  return record;
}

export class FixturePartnershipAnalysisAssistant implements PartnershipAnalysisAssistant {
  async extractTerms(input: string): Promise<ProposalTerms> {
    const terms: ProposalTerms = { ...ATLAS_PROPOSAL };
    for (const rule of TERM_RULES) {
      const match = input.match(rule.pattern);
      if (match) {
        Object.assign(terms, rule.apply(match));
      }
    }
    terms.sourceType = "synthetic";
    return terms;
  }

  async generateDiligenceQuestions(): Promise<string[]> {
    return [...ATLAS_DILIGENCE_QUESTIONS];
  }

  async challengeAssumptions(): Promise<ChallengeFinding[]> {
    return ATLAS_RED_TEAM_FINDINGS.map((finding) => ({ ...finding }));
  }

  async draftNegotiationBrief(context: Opportunity): Promise<Recommendation> {
    return computeRecommendation({
      scenarios: scenariosByName(context),
      proposal: context.proposal,
      risks: context.risks,
      totalEconomicCostUsd: context.proposal.cashConsiderationUsd,
      missingEvidence: context.recommendation?.missingEvidence ?? [],
      changeConditions: context.recommendation?.changeConditions ?? [],
    });
  }
}
