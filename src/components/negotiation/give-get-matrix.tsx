import {
  Card,
  CardContent,
  CardDescription,
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
import type { Scenario } from "@/lib/domain/types";
import { formatUsdM, formatUsdMDelta } from "@/lib/export/format";
import type { GiveGetRow } from "@/lib/negotiation/derive";

export interface GiveGetMatrixProps {
  rows: GiveGetRow[];
  base: Scenario;
  upside: Scenario;
}

export function GiveGetMatrix({ rows, base, upside }: GiveGetMatrixProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Give / get matrix</CardTitle>
        <CardDescription>Trades to put on the table and what each one changes</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Give / get matrix</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-28">We give</TableHead>
              <TableHead className="min-w-28">We get</TableHead>
              <TableHead>Economic impact</TableHead>
              <TableHead>Strategic impact</TableHead>
              <TableHead>Risk effect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.give}-${index}`}>
                <TableCell className="whitespace-normal">{row.give}</TableCell>
                <TableCell className="whitespace-normal">{row.get}</TableCell>
                <TableCell className="tabular-nums whitespace-normal">
                  {formatUsdMDelta(row.economicImpactUsd)}
                </TableCell>
                <TableCell className="whitespace-normal">{row.strategicImpact}</TableCell>
                <TableCell className="whitespace-normal">{row.riskEffect}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Economic impact figures are model-grounded ceilings, not negotiated point estimates —
          each is tied to a specific line item already on this screen (the NPV of the annual
          license fee, confidence-adjusted exclusivity/implementation cost, or NPV of cash
          deferred by a pilot). See each row&apos;s strategic impact for its source; treat the
          number as the most that concession could be worth, not a price. For context, this base
          case&apos;s confidence-adjusted value is {formatUsdM(base.confidenceAdjustedValueUsd)}{" "}
          against an upside of {formatUsdM(upside.confidenceAdjustedValueUsd)}.
        </p>
      </CardContent>
    </Card>
  );
}
