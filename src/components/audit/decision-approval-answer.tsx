"use client";

import { useApproval } from "@/components/approval/approval-context";
import { formatDate } from "@/lib/export";

/**
 * Renders the Q7 explainability answer ("Who approved the final view?")
 * from the same shared approval state as the timeline banner and the
 * "Approve decision" button, so the two can never disagree.
 */
export function DecisionApprovalAnswer() {
  const { approved, approvedBy, approvedAt } = useApproval();

  if (!approved) {
    return <li>Decision approval: awaiting human sign-off (use Approve decision).</li>;
  }

  return (
    <li>
      Decision approval: approved by {approvedBy} on {formatDate(approvedAt ?? "")}.
    </li>
  );
}
