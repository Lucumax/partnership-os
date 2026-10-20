import type { ComparableTransaction } from "@/lib/domain/types";

const CSV_HEADERS = [
  "id",
  "name",
  "archetype",
  "announcementDate",
  "disclosedValueUsd",
  "cashComponentUsd",
  "inKindValueUsd",
  "termMonths",
  "exclusivity",
  "minimumUsage",
  "distributionCommitment",
  "integrationBurden",
  "comparabilityScore",
  "recencyDecayFactor",
  "sourceQuality",
  "synthetic",
];

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(comparables: ComparableTransaction[]): string {
  const rows = comparables.map((comparable) =>
    [
      comparable.id,
      comparable.name,
      comparable.archetype,
      comparable.announcementDate,
      comparable.disclosedValueUsd,
      comparable.cashComponentUsd,
      comparable.inKindValueUsd,
      comparable.termMonths,
      comparable.exclusivity,
      comparable.minimumUsage,
      comparable.distributionCommitment,
      comparable.integrationBurden,
      comparable.comparabilityScore,
      comparable.recencyDecayFactor,
      comparable.sourceQuality,
      comparable.synthetic,
    ]
      .map(escapeCsv)
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n") + "\n";
}
