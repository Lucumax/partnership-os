import { ClaudePartnershipAnalysisAssistant } from "@/lib/assistant/claude";
import { FixturePartnershipAnalysisAssistant } from "@/lib/assistant/fixture";
import type { PartnershipAnalysisAssistant } from "@/lib/assistant/types";

function isTruthy(value: string | undefined): boolean {
  if (value === undefined || value === "") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isLiveAiEnabled(): boolean {
  return isTruthy(process.env.PARTNERSHIP_OS_LIVE_AI_ENABLED);
}

export function liveAiControlsVerified(): boolean {
  return isTruthy(process.env.PARTNERSHIP_OS_LIVE_AI_CONTROLS_VERIFIED);
}

export function hasLiveAiCredentials(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return typeof apiKey === "string" && apiKey.trim() !== "";
}

export function liveAiConfigured(): boolean {
  return isLiveAiEnabled() && liveAiControlsVerified() && hasLiveAiCredentials();
}

export function getAssistant(): PartnershipAnalysisAssistant {
  if (liveAiConfigured()) {
    return new ClaudePartnershipAnalysisAssistant({
      liveAiEnabled: true,
      controlsVerified: true,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return new FixturePartnershipAnalysisAssistant();
}
