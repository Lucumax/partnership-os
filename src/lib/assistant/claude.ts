import type { ChallengeFinding } from "@/lib/assistant/challenge";
import type { PartnershipAnalysisAssistant } from "@/lib/assistant/types";
import type { ProposalTerms, Recommendation } from "@/lib/domain/types";

export interface ClaudeAssistantConfig {
  liveAiEnabled: boolean;
  controlsVerified: boolean;
  apiKey?: string;
}

function isTruthy(value: string | undefined): boolean {
  if (value === undefined || value === "") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function defaultConfig(): ClaudeAssistantConfig {
  return {
    liveAiEnabled: isTruthy(process.env.PARTNERSHIP_OS_LIVE_AI_ENABLED),
    controlsVerified: isTruthy(process.env.PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED),
    apiKey: process.env.ANTHROPIC_API_KEY,
  };
}

const NOT_CONFIGURED_MESSAGE =
  "ClaudePartnershipAnalysisAssistant is not configured: PARTNERSHIP_OS_LIVE_AI_ENABLED and PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED must be true and ANTHROPIC_API_KEY must be set";

const NOT_IMPLEMENTED_MESSAGE =
  "ClaudePartnershipAnalysisAssistant is a stub: live Anthropic calls are not implemented in the MVP";

export class ClaudePartnershipAnalysisAssistant implements PartnershipAnalysisAssistant {
  private readonly config: ClaudeAssistantConfig;

  constructor(config: ClaudeAssistantConfig = defaultConfig()) {
    this.config = config;
  }

  private assertConfigured(): void {
    const apiKey = this.config.apiKey;
    const configured =
      this.config.liveAiEnabled &&
      this.config.controlsVerified &&
      typeof apiKey === "string" &&
      apiKey.trim() !== "";
    if (!configured) {
      throw new Error(NOT_CONFIGURED_MESSAGE);
    }
  }

  async extractTerms(): Promise<ProposalTerms> {
    this.assertConfigured();
    throw new Error(NOT_IMPLEMENTED_MESSAGE);
  }

  async generateDiligenceQuestions(): Promise<string[]> {
    this.assertConfigured();
    throw new Error(NOT_IMPLEMENTED_MESSAGE);
  }

  async challengeAssumptions(): Promise<ChallengeFinding[]> {
    this.assertConfigured();
    throw new Error(NOT_IMPLEMENTED_MESSAGE);
  }

  async draftNegotiationBrief(): Promise<Recommendation> {
    this.assertConfigured();
    throw new Error(NOT_IMPLEMENTED_MESSAGE);
  }
}
