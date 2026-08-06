"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AILabel, type AiLabelProps } from "@/components/assistant/ai-label";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ApprovalContextValue {
  /** True once a human has approved via `approve()`. */
  approved: boolean;
  /** Name of the human who approved, or null while awaiting sign-off. */
  approvedBy: string | null;
  /** ISO timestamp of the approval, or null while awaiting sign-off. */
  approvedAt: string | null;
  /** Records an explicit human approval. Must be called from a user action. */
  approve: (approver: string) => void;
  /** Reverts to the awaiting-approval state. */
  revoke: () => void;
}

const ApprovalContext = createContext<ApprovalContextValue | null>(null);

export interface ApprovalProviderProps {
  children: ReactNode;
  /** Seed value, e.g. from a fixture that already records a prior approval. */
  initialApprovedBy?: string | null;
  initialApprovedAt?: string | null;
}

/**
 * Single source of truth for "is this decision/brief approved" within a
 * page. Every element that renders approval status -- header badges, AI
 * labels, timeline banners, action bars, explainability answers -- must
 * read from this context instead of holding its own local approval
 * state. Local `useState` per island is exactly what let one part of a
 * page say "approved" while an adjacent part still said "awaiting".
 *
 * This is intentionally just in-memory client state: no persistence, no
 * store library. Approval never happens implicitly -- state only changes
 * when `approve()` is invoked from an explicit button click.
 */
export function ApprovalProvider({
  children,
  initialApprovedBy = null,
  initialApprovedAt = null,
}: ApprovalProviderProps) {
  const [approvedBy, setApprovedBy] = useState<string | null>(initialApprovedBy);
  const [approvedAt, setApprovedAt] = useState<string | null>(initialApprovedAt);

  const approve = useCallback((approver: string) => {
    setApprovedBy(approver);
    setApprovedAt(new Date().toISOString());
  }, []);

  const revoke = useCallback(() => {
    setApprovedBy(null);
    setApprovedAt(null);
  }, []);

  const value = useMemo<ApprovalContextValue>(
    () => ({
      approved: approvedBy != null,
      approvedBy,
      approvedAt,
      approve,
      revoke,
    }),
    [approvedBy, approvedAt, approve, revoke],
  );

  return <ApprovalContext.Provider value={value}>{children}</ApprovalContext.Provider>;
}

export function useApproval(): ApprovalContextValue {
  const ctx = useContext(ApprovalContext);
  if (!ctx) {
    throw new Error("useApproval must be used within an ApprovalProvider");
  }
  return ctx;
}

/**
 * AILabel wired to the page's ApprovalProvider instead of a static/local
 * "approvalStatus" prop, so every AI label on a page necessarily agrees
 * with the rest of the page.
 */
export function ApprovalAwareAiLabel(props: Omit<AiLabelProps, "approvalStatus">) {
  const { approved } = useApproval();
  return <AILabel {...props} approvalStatus={approved ? "approved" : "awaiting"} />;
}

export interface ApprovalBadgeProps {
  approvedLabel?: string;
  awaitingLabel?: string;
  className?: string;
}

/** Outline badge ("Approved" / "Awaiting approval") wired to the shared approval state. */
export function ApprovalBadge({
  approvedLabel = "Approved",
  awaitingLabel = "Awaiting approval",
  className,
}: ApprovalBadgeProps) {
  const { approved } = useApproval();
  return (
    <span
      className={cn(
        badgeVariants({ variant: "outline" }),
        "border-primary/30 text-primary",
        className,
      )}
    >
      {approved ? approvedLabel : awaitingLabel}
    </span>
  );
}
