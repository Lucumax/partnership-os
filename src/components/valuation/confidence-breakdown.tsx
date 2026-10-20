import { ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ConfidenceFactorDims, ScenarioName } from "@/lib/domain/types";
import type { ValuationResult } from "@/lib/valuation/engine";

const DIM_KEYS: Array<keyof ConfidenceFactorDims> = [
  "evidenceQuality",
  "assumptionStability",
  "comparableQuality",
  "implementationCertainty",
  "partnerExecutionConfidence",
];

const DIM_LABELS: Record<keyof ConfidenceFactorDims, string> = {
  evidenceQuality: "Evidence quality",
  assumptionStability: "Assumption stability",
  comparableQuality: "Comparable quality",
  implementationCertainty: "Implementation certainty",
  partnerExecutionConfidence: "Partner execution",
};

const SCENARIOS: ScenarioName[] = ["downside", "base", "upside"];

const pct = (value: number) => `${Math.round(value * 100)}%`;

export function ConfidenceBreakdown({ valuation }: { valuation: ValuationResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ListChecks className="size-3.5" aria-hidden="true" /> Confidence factors
        </CardTitle>
        <CardDescription>How much we trust each scenario — five equal-weight dimensions, averaged into the confidence factor.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Confidence factors by scenario</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Dimension</TableHead>
              {SCENARIOS.map((name) => (
                <TableHead key={name} className="text-right capitalize">
                  {name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {DIM_KEYS.map((key) => (
              <TableRow key={key}>
                <TableCell className="text-sm whitespace-normal">{DIM_LABELS[key]}</TableCell>
                {SCENARIOS.map((name) => (
                  <TableCell key={name} className="text-right text-sm tabular-nums">
                    {pct(valuation.byName[name].confidenceFactorDims[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell className="text-sm font-medium whitespace-normal">
                Confidence factor (mean)
              </TableCell>
              {SCENARIOS.map((name) => (
                <TableCell key={name} className="text-right text-sm font-medium tabular-nums">
                  {pct(valuation.byName[name].confidenceFactor)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
