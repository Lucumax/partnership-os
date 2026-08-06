"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileJson, LoaderCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApprovalAwareAiLabel, useApproval } from "@/components/approval/approval-context";
import { downloadBlob } from "@/lib/export/download";

interface NegotiationActionsProps {
  markdown: string;
  json: string;
  /** Name recorded as the approver when a human clicks "Approve brief". */
  approver: string;
}

export function NegotiationActions({
  markdown,
  json,
  approver,
}: NegotiationActionsProps) {
  const { approved, approve, revoke } = useApproval();
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(false);

  const generateBrief = () => {
    setGeneratedAt(new Date().toISOString());
    setShowBrief(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={generateBrief}>
          <LoaderCircle className="size-3.5" aria-hidden="true" />
          Generate brief
        </Button>
        <Button
          size="sm"
          variant={approved ? "outline" : "default"}
          onClick={() => (approved ? revoke() : approve(approver))}
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {approved ? "Revoke approval" : "Approve brief"}
        </Button>
        <div className="flex flex-wrap gap-2 ml-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadBlob("atlas-negotiation-brief.md", markdown, "text/markdown")
            }
          >
            <Download className="size-3.5" aria-hidden="true" />
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
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant={approved ? "default" : "outline"}>
            <CheckCircle2 className="size-3" aria-hidden="true" />
            {approved ? "Brief approved" : "Awaiting approval"}
          </Badge>
        </div>
      </div>
      {showBrief ? (
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ApprovalAwareAiLabel
              generatedAt={generatedAt ?? undefined}
              modelId="deterministic-engine"
              sources={["3 scenarios", "5 comparables"]}
              uncertainty="low"
            />
            <span className="text-xs text-muted-foreground">
              Deterministic template · no live AI at runtime
            </span>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs text-foreground">
            {markdown}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
