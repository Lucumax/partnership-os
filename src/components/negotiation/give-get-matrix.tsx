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
        <CardDescription>
          Seeded trade options with derived economic, strategic, and risk effects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
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
          Economic impact is a deterministic share of the upside headroom (
          {formatUsdM(upside.confidenceAdjustedValueUsd)} vs{" "}
          {formatUsdM(base.confidenceAdjustedValueUsd)}).
        </p>
      </CardContent>
    </Card>
  );
}
