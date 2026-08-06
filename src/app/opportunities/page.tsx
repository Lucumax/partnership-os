import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortfolioOnlyBadge } from "@/components/portfolio/portfolio-only-badge";
import { formatDate, formatM } from "@/components/portfolio/format";
import { archetypeLabel, stageLabel } from "@/components/portfolio/labels";
import { PORTFOLIO_ENTRIES } from "@/lib/fixtures";

export const metadata: Metadata = {
  title: "Opportunities — Partnership OS",
  description: `The ${PORTFOLIO_ENTRIES.length} cases in the portfolio — where each stands, what it would cost, and what it is worth.`,
};

export default function OpportunitiesPage() {
  const entries = [...PORTFOLIO_ENTRIES];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Opportunities
        </h1>
        <p className="max-w-3xl text-sm font-medium text-muted-foreground">
          The {entries.length} cases in the portfolio, and where each stands: stage, what it
          would cost, and its confidence-adjusted value (CAV). Only Atlas Knowledge Systems is
          modeled end-to-end; the other cases populate portfolio-level views — all names and
          numbers are fictional.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Portfolio cases</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <Table>
            <TableCaption className="sr-only">Portfolio cases</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Archetype</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Decision date</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">CAV</TableHead>
                <TableHead className="text-right">Gap vs cost</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const gapUsd = entry.confidenceAdjustedValueUsd - entry.economicCostUsd;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.modeled && entry.href ? (
                        <div className="flex flex-col">
                          <Link
                            href={entry.href}
                            className="inline-flex items-center gap-1 font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {entry.name}
                            <ArrowRight className="size-3" aria-hidden="true" />
                          </Link>
                          <span className="text-xs font-medium text-muted-foreground">
                            {entry.partnerAlias}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="inline-flex flex-wrap items-center gap-1.5 font-medium">
                            {entry.name}
                            <PortfolioOnlyBadge />
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {entry.partnerAlias}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{archetypeLabel(entry.archetype)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stageLabel(entry.stage)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">{entry.owner}</TableCell>
                    <TableCell className="tabular-nums">
                      {entry.decisionDate ? formatDate(entry.decisionDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatM(entry.grossValueUsd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatM(entry.confidenceAdjustedValueUsd)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${
                        gapUsd < 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {formatM(gapUsd, { sign: true })}
                    </TableCell>
                    <TableCell>
                      {entry.highRisk ? (
                        <Badge variant="destructive">High risk</Badge>
                      ) : (
                        <span className="font-medium text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
