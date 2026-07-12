export const RESEARCH_STATUSES = ["draft", "submitted", "in_review", "approved", "in_progress", "completed", "rejected", "promoted"] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];

export type ProposalState = {
  hypothesis: string;
  exitCriteria: string;
  dataProtectionPlan: string;
  ethicsApproved: boolean;
  securityApproved: boolean;
  outcome: string | null;
  rejectionRationale: string | null;
  promotedIssueUrl: string | null;
};

const TRANSITIONS: Readonly<Record<ResearchStatus, readonly ResearchStatus[]>> = {
  draft: ["submitted"],
  submitted: ["in_review"],
  in_review: ["approved", "rejected"],
  approved: ["in_progress"],
  in_progress: ["completed", "rejected"],
  completed: ["promoted"],
  rejected: [],
  promoted: [],
};

/**
 * Deterministic research lifecycle. Every gate the issue contract requires is
 * enforced here: a hypothesis and exit criteria before submission, ethics and
 * security review before approval, a published outcome before completion, a
 * retained rationale for every rejection, and a scoped delivery issue before
 * promotion. Terminal states (rejected, promoted) cannot be left, so
 * rationale and outcomes are never overwritten.
 */
export function assertTransition(from: ResearchStatus, to: ResearchStatus, proposal: ProposalState): void {
  if (!TRANSITIONS[from].includes(to)) throw new Error(`A proposal cannot move from ${from} to ${to}`);
  if (to === "submitted") {
    if (proposal.hypothesis.trim().length < 10) throw new Error("Submission requires a testable hypothesis");
    if (proposal.exitCriteria.trim().length < 10) throw new Error("Submission requires explicit exit criteria");
    if (proposal.dataProtectionPlan.trim().length < 10) throw new Error("Submission requires a data-protection plan for user and vendor data");
  }
  if (to === "approved" && (!proposal.ethicsApproved || !proposal.securityApproved)) throw new Error("Approval requires completed ethics and security reviews");
  if (to === "completed" && !(proposal.outcome && proposal.outcome.trim().length >= 10)) throw new Error("Completion requires a published outcome");
  if (to === "rejected" && !(proposal.rejectionRationale && proposal.rejectionRationale.trim().length >= 10)) throw new Error("Rejection requires a retained rationale");
  if (to === "promoted" && !proposal.promotedIssueUrl) throw new Error("Promotion requires a scoped delivery issue");
}
