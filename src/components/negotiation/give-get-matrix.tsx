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
              <TableHead>We give</TableHead>
              <TableHead>We get</TableHead>
              <TableHead>Economic impact</TableHead>
              <TableHead>Strategic impact</TableHead>
              <TableHead>Risk effect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.give}-${index}`}>
                <TableCell>{row.give}</TableCell>
                <TableCell>{row.get}</TableCell>
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
          Economic impact is a fixed share of the headroom between the base and upside scenarios
          ({formatUsdM(upside.confidenceAdjustedValueUsd)} vs{" "}
          {formatUsdM(base.confidenceAdjustedValueUsd)}).
        </p>
      </CardContent>
    </Card>
  );
}
