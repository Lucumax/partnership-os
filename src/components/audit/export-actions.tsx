"use client";

import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/export/download";

interface AuditExportsProps {
  markdown: string;
  json: string;
  csv: string;
}

export function AuditExports({ markdown, json, csv }: AuditExportsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => downloadBlob("atlas-negotiation-brief.md", markdown, "text/markdown")}
      >
        <FileText className="size-3.5" aria-hidden="true" />
        Export Markdown
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => downloadBlob("atlas-opportunity.json", json, "application/json")}
      >
        <FileJson className="size-3.5" aria-hidden="true" />
        Export JSON
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => downloadBlob("atlas-comparables.csv", csv, "text/csv")}
      >
        <FileSpreadsheet className="size-3.5" aria-hidden="true" />
        Export CSV
      </Button>
      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
        <Download className="size-3" aria-hidden="true" />
        Client-side downloads · synthetic case only
      </span>
    </div>
  );
}
