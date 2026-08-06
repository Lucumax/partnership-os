"use client";

import { useState } from "react";
import { CheckCircle2, Paperclip, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { badgeVariants } from "@/components/ui/badge";
import { useApproval } from "@/components/approval/approval-context";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/lib/domain/types";

interface AuditTimelineProps {
  events: AuditEvent[];
  owner: string;
  decision: string;
  opportunityName: string;
}

function formatValue(value: unknown): string {
  if (value == null) {
    return "—";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";

function actorTypeVariant(actorType: AuditEvent["actorType"]): BadgeVariant {
  return actorType === "human" ? "default" : "outline";
}

export function AuditTimeline({
  events: initialEvents,
  owner,
  decision,
  opportunityName,
}: AuditTimelineProps) {
  const [events, setEvents] = useState(initialEvents);
  const { approved, approvedAt, approve } = useApproval();

  const approveDecision = () => {
    if (approved) {
      return;
    }
    const now = new Date().toISOString();
    approve(owner);
    const approvalEvent: AuditEvent = {
      id: `audit-human-${now}`,
      timestamp: now,
      actor: owner,
      actorType: "human",
      action: "decision.approved",
      field: "recommendation.decision",
      newValue: decision,
      rationale: `Human review of the ${opportunityName} recommendation completed; decision approved.`,
    };
    setEvents((previous) => [...previous, approvalEvent]);
  };

  const sortedEvents = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision history</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <span
            className={cn(
              badgeVariants({ variant: approved ? "default" : "outline" }),
            )}
          >
            <CheckCircle2 className="size-3" aria-hidden="true" />
            {approved ? "Decision approved" : "Awaiting human approval"}
          </span>
          {approved ? (
            <span className="text-sm text-muted-foreground">
              Approved by {owner} at {new Date(approvedAt as string).toISOString()}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Final decision requires human sign-off before contracting.
            </span>
          )}
          <Button
            size="sm"
            variant={approved ? "outline" : "default"}
            className="ml-auto"
            onClick={approveDecision}
            disabled={approved}
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Approve decision
          </Button>
        </div>

        <ol className="relative flex flex-col gap-4 border-l pl-4">
          {sortedEvents.map((event) => (
            <li key={event.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-background",
                  event.actorType === "human" ? "bg-primary" : "bg-muted-foreground/40",
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{event.actor}</span>
                <span
                  className={cn(badgeVariants({ variant: actorTypeVariant(event.actorType) }))}
                >
                  {event.actorType}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toISOString()}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium">{event.action}</p>
              {event.field ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  field: {event.field}
                  {event.previousValue !== undefined ? (
                    <>
                      {" "}
                      · previous: {formatValue(event.previousValue)}
                    </>
                  ) : null}
                  {event.newValue !== undefined ? (
                    <>
                      {" "}
                      · new: {formatValue(event.newValue)}
                    </>
                  ) : null}
                </p>
              ) : null}
              {event.rationale ? (
                <p className="mt-1 text-sm text-muted-foreground">{event.rationale}</p>
              ) : null}
              {event.evidenceIds && event.evidenceIds.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {event.evidenceIds.map((evidenceId) => (
                    <span
                      key={evidenceId}
                      className={cn(
                        badgeVariants({ variant: "outline" }),
                        "gap-1 text-xs",
                      )}
                    >
                      <Paperclip className="size-2.5" aria-hidden="true" />
                      {evidenceId}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
