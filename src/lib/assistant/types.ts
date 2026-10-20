import type { ChallengeFinding } from "@/lib/assistant/challenge";
import type { Opportunity, ProposalTerms, Recommendation } from "@/lib/domain/types";

export interface PartnershipAnalysisAssistant {
  extractTerms(input: string): Promise<ProposalTerms>;
  generateDiligenceQuestions(context: Opportunity): Promise<string[]>;
  challengeAssumptions(context: Opportunity): Promise<ChallengeFinding[]>;
  draftNegotiationBrief(context: Opportunity): Promise<Recommendation>;
}
