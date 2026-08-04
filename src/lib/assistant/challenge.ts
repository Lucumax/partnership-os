import type { Severity } from "@/lib/domain/types";

export interface ChallengeFinding {
  id: string;
  severity: Severity;
  finding: string;
  evidenceId?: string;
}
