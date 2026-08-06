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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
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
      <TableCaption className="sr-only">Assumption inputs</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Variable</TableHead>
          {CELL_KEYS.map((key) => (
            <TableHead key={key} className="w-24 text-right">
              {key}
            </TableHead>
          ))}
          <TableHead className="min-w-32">Evidence</TableHead>
          <TableHead className="w-28">Confidence</TableHead>
          <TableHead className="min-w-24">Owner</TableHead>
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
                      className="h-7 w-full min-w-14 text-right"
                      value={row[key]}
                      onChange={(event) =>
                        onChange(row.id, { [key]: event.target.value, lastUpdatedAt: TODAY })
                      }
                    />
                  </TableCell>
                ))}
                <TableCell className="align-top whitespace-normal">
                  {/* Evidence notes vary widely in length (a few words to a full
                      sentence); a single-line <input> always clips the tail of the
                      longer ones no matter how wide the column, because inputs never
                      wrap. A wrapping textarea (auto-sized to its content via
                      field-sizing-content, see ui/textarea.tsx) grows to fit whatever
                      text is actually there instead of hiding it. */}
                  <Textarea
                    value={row.evidence}
                    rows={1}
                    className="min-h-7 resize-none py-1 text-sm leading-snug"
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
                  {/* Owner tokens ("research.stakeholder") are long, dotted, and have
                      no spaces, so plain word-wrap can't break them at all -- without
                      break-all this column would have to be ~150px wide to avoid ever
                      clipping the longest name. break-all lets the column stay
                      compact: short owners ("deal.lead") still render on a single
                      line because they already fit the column, and only the two or
                      three genuinely long ones wrap onto a second line instead of
                      being hidden. */}
                  <Textarea
                    value={row.owner}
                    rows={1}
                    className="min-h-7 resize-none py-1 text-sm leading-snug break-all"
                    onChange={(event) => onChange(row.id, { owner: event.target.value })}
                  />
                </TableCell>
                <TableCell className="align-top text-xs font-medium text-muted-foreground tabular-nums">
                  {row.lastUpdatedAt}
                </TableCell>
              </TableRow>
            )),
        ])}
      </TableBody>
    </Table>
  );
}
