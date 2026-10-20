import type { Opportunity } from "@/lib/domain/types";

export function toJson(opportunity: Opportunity): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      case: opportunity,
    },
    null,
    2,
  );
}
