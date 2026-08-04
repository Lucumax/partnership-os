"use client";

import type { Confidence } from "@/lib/domain/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssumptionRow } from "./assumption-model";
import { CONFIDENCE_LABELS } from "./format";

const TODAY = new Date().toISOString().slice(0, 10);

type CellKey = "downside" | "base" | "upside";
const CELL_KEYS: CellKey[] = ["downside", "base", "upside"];

const GROUPS: Array<{ key: AssumptionRow["kind"]; label: string }> = [
  { key: "value", label: "Value components" },
  { key: "cost", label: "Cost components" },
  { key: "confidence", label: "Confidence factors" },
];

interface AssumptionTableProps {
  rows: AssumptionRow[];
  onChange: (id: string, patch: Partial<AssumptionRow>) => void;
}

export function AssumptionTable({ rows, onChange }: AssumptionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Variable</TableHead>
          {CELL_KEYS.map((key) => (
            <TableHead key={key} className="w-24 text-right">
              {key}
            </TableHead>
          ))}
          <TableHead className="min-w-44">Evidence</TableHead>
          <TableHead className="w-28">Confidence</TableHead>
          <TableHead className="w-32">Owner</TableHead>
          <TableHead className="w-24">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {GROUPS.flatMap((group) => [
          <TableRow key={`${group.key}-header`} className="bg-muted/40 hover:bg-muted/40">
            <TableCell
              colSpan={9}
              className="py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              {group.label}
            </TableCell>
          </TableRow>,
          ...rows
            .filter((row) => row.kind === group.key)
            .map((row) => (
              <TableRow key={row.id}>
                <TableCell className="align-top whitespace-normal">
                  <div className="text-sm leading-tight font-medium">{row.variable}</div>
                </TableCell>
                {CELL_KEYS.map((key) => (
                  <TableCell key={key} className="p-1.5 align-top">
                    <Input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      className="h-7 w-full min-w-16 text-right"
                      value={row[key]}
                      onChange={(event) =>
                        onChange(row.id, { [key]: event.target.value, lastUpdatedAt: TODAY })
                      }
                    />
                  </TableCell>
                ))}
                <TableCell className="align-top whitespace-normal">
                  <Input
                    value={row.evidence}
                    className="h-7"
                    onChange={(event) => onChange(row.id, { evidence: event.target.value })}
                  />
                </TableCell>
                <TableCell className="align-top">
                  <Select
                    value={row.confidence}
                    onValueChange={(value) =>
                      onChange(row.id, { confidence: value as Confidence })
                    }
                  >
                    <SelectTrigger size="sm" className="h-7 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "medium", "high"] as Confidence[]).map((level) => (
                        <SelectItem key={level} value={level}>
                          {CONFIDENCE_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    value={row.owner}
                    className="h-7"
                    onChange={(event) => onChange(row.id, { owner: event.target.value })}
                  />
                </TableCell>
                <TableCell className="align-top text-xs text-muted-foreground tabular-nums">
                  {row.lastUpdatedAt}
                </TableCell>
              </TableRow>
            )),
        ])}
      </TableBody>
    </Table>
  );
}
