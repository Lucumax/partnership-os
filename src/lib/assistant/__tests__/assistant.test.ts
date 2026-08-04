import { afterEach, describe, expect, it } from "vitest";
import { ClaudePartnershipAnalysisAssistant } from "@/lib/assistant/claude";
import {
  ATLAS_DILIGENCE_QUESTIONS,
  ATLAS_RED_TEAM_FINDINGS,
  FixturePartnershipAnalysisAssistant,
  SYNTHETIC_PROPOSAL_TEXT,
} from "@/lib/assistant/fixture";
import type { Opportunity, Scenario, ScenarioName } from "@/lib/domain/types";
import { proposalTermsSchema } from "@/lib/domain/schemas";
import { ATLAS_OPPORTUNITY, ATLAS_PROPOSAL, ATLAS_RECOMMENDATION } from "@/lib/fixtures/atlas";
import { computeRecommendation } from "@/lib/valuation/engine";
import { getAssistant, isLiveAiEnabled, liveAiControlsVerified } from "@/lib/flags";

function scenariosByName(opportunity: Opportunity): Record<ScenarioName, Scenario> {
  const index = new Map<ScenarioName, Scenario>();
  for (const scenario of opportunity.scenarios) {
    index.set(scenario.name, scenario);
  }
  const record = {} as Record<ScenarioName, Scenario>;
  for (const name of ["downside", "base", "upside"] as const) {
    const scenario = index.get(name);
    if (!scenario) {
      throw new Error(`missing scenario "${name}"`);
    }
    record[name] = scenario;
  }
  return record;
}

describe("FixturePartnershipAnalysisAssistant", () => {
  const assistant = new FixturePartnershipAnalysisAssistant();

  it("extractTerms maps the sample synthetic proposal text to the seeded ProposalTerms", async () => {
    const terms = await assistant.extractTerms(SYNTHETIC_PROPOSAL_TEXT);
    expect(terms).toEqual(ATLAS_PROPOSAL);
    expect(terms.sourceType).toBe("synthetic");
    expect(proposalTermsSchema.safeParse(terms).success).toBe(true);
  });

  it("extractTerms deterministically overrides fields from explicit text", async () => {
    const terms = await assistant.extractTerms(
      "Revised proposal: 24-month term with a $2.0M upfront payment instead.",
    );
    expect(terms.termMonths).toBe(24);
    expect(terms.upfrontCashUsd).toBe(2.0);
    expect(terms.sourceType).toBe("synthetic");
  });

  it("generateDiligenceQuestions returns the seeded diligence question list", async () => {
    const questions = await assistant.generateDiligenceQuestions();
    expect(questions).toEqual([...ATLAS_DILIGENCE_QUESTIONS]);
    expect(questions).toHaveLength(10);
  });

  it("challengeAssumptions returns the red-team findings with severities", async () => {
    const findings = await assistant.challengeAssumptions();
    expect(findings).toHaveLength(ATLAS_RED_TEAM_FINDINGS.length);
    for (const finding of findings) {
      expect(finding.id.length).toBeGreaterThan(0);
      expect(["low", "medium", "high", "critical"]).toContain(finding.severity);
      expect(finding.finding.length).toBeGreaterThan(0);
    }
    expect(findings.filter((finding) => finding.severity === "high")).not.toHaveLength(0);
    expect(findings.filter((finding) => finding.evidenceId !== undefined)).not.toHaveLength(0);
  });

  it("draftNegotiationBrief matches computeRecommendation for the seeded case", async () => {
    const expected = computeRecommendation({
      scenarios: scenariosByName(ATLAS_OPPORTUNITY),
      proposal: ATLAS_OPPORTUNITY.proposal,
      risks: ATLAS_OPPORTUNITY.risks,
      totalEconomicCostUsd: ATLAS_OPPORTUNITY.proposal.cashConsiderationUsd,
      missingEvidence: ATLAS_RECOMMENDATION.missingEvidence,
      changeConditions: ATLAS_RECOMMENDATION.changeConditions,
    });
    const actual = await assistant.draftNegotiationBrief(ATLAS_OPPORTUNITY);
    expect(actual).toEqual(expected);
    expect(actual.generatedBy).toBe("ai_draft");
    expect(actual.decision).toBe("pilot");
  });
});

describe("ClaudePartnershipAnalysisAssistant stub", () => {
  it("throws not configured when feature flags are off", async () => {
    const stub = new ClaudePartnershipAnalysisAssistant({
      liveAiEnabled: false,
      controlsVerified: false,
    });
    await expect(stub.extractTerms()).rejects.toThrow(/not configured/i);
    await expect(stub.challengeAssumptions()).rejects.toThrow(/not configured/i);
    await expect(stub.draftNegotiationBrief()).rejects.toThrow(/not configured/i);
  });

  it("throws not configured when credentials are missing", async () => {
    const stub = new ClaudePartnershipAnalysisAssistant({
      liveAiEnabled: true,
      controlsVerified: true,
      apiKey: "",
    });
    await expect(stub.extractTerms()).rejects.toThrow(/not configured/i);
  });

  it("remains a stub when fully configured", async () => {
    const stub = new ClaudePartnershipAnalysisAssistant({
      liveAiEnabled: true,
      controlsVerified: true,
      apiKey: "sk-test",
    });
    await expect(stub.extractTerms()).rejects.toThrow(/not implemented/i);
  });
});

describe("feature flags", () => {
  const saved = {
    live: process.env.PARTNERSHIP_OS_LIVE_AI_ENABLED,
    controls: process.env.PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED,
    key: process.env.ANTHROPIC_API_KEY,
  };

  function setEnv(name: string, value: string | undefined): void {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  afterEach(() => {
    setEnv("PARTNERSHIP_OS_LIVE_AI_ENABLED", saved.live);
    setEnv("PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED", saved.controls);
    setEnv("ANTHROPIC_API_KEY", saved.key);
  });

  it("flags default to false", () => {
    setEnv("PARTNERSHIP_OS_LIVE_AI_ENABLED", undefined);
    setEnv("PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED", undefined);
    setEnv("ANTHROPIC_API_KEY", undefined);
    expect(isLiveAiEnabled()).toBe(false);
    expect(liveAiControlsVerified()).toBe(false);
  });

  it("getAssistant returns the fixture when flags are false", () => {
    setEnv("PARTNERSHIP_OS_LIVE_AI_ENABLED", undefined);
    setEnv("PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED", undefined);
    setEnv("ANTHROPIC_API_KEY", undefined);
    expect(getAssistant()).toBeInstanceOf(FixturePartnershipAnalysisAssistant);
  });

  it("getAssistant stays on the fixture when only a key is present", () => {
    setEnv("PARTNERSHIP_OS_LIVE_AI_ENABLED", "false");
    setEnv("PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED", "false");
    setEnv("ANTHROPIC_API_KEY", "sk-test");
    expect(getAssistant()).toBeInstanceOf(FixturePartnershipAnalysisAssistant);
  });

  it("getAssistant stays on the fixture when flags are set but no key is present", () => {
    setEnv("PARTNERSHIP_OS_LIVE_AI_ENABLED", "true");
    setEnv("PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED", "true");
    setEnv("ANTHROPIC_API_KEY", undefined);
    expect(getAssistant()).toBeInstanceOf(FixturePartnershipAnalysisAssistant);
  });

  it("getAssistant returns the Claude stub only when both flags and a key are present", () => {
    setEnv("PARTNERSHIP_OS_LIVE_AI_ENABLED", "true");
    setEnv("PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED", "true");
    setEnv("ANTHROPIC_API_KEY", "sk-test");
    expect(getAssistant()).toBeInstanceOf(ClaudePartnershipAnalysisAssistant);
  });
});
