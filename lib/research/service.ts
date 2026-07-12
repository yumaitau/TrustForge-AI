import { and, desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { auditEvents, researchProposals, researchReviews } from "@/db/schema";
import { db } from "@/lib/db/client";
import { assertTransition, RESEARCH_STATUSES, type ResearchStatus } from "./lifecycle";

type Actor = { userId: string; organisationId: string };

export const proposalSchema = z.object({ key: z.string().regex(/^[a-z0-9-]{3,80}$/), title: z.string().min(3).max(240), hypothesis: z.string().min(10).max(8000), exitCriteria: z.string().min(10).max(8000), dataProtectionPlan: z.string().min(10).max(8000) });
export const reviewSchema = z.object({ kind: z.enum(["ethics", "security"]), approved: z.boolean(), notes: z.string().min(10).max(8000) });
export const transitionSchema = z.object({ status: z.enum(RESEARCH_STATUSES), outcome: z.string().max(8000).optional(), outcomeUrl: z.url().optional(), rejectionRationale: z.string().max(8000).optional(), promotedIssueUrl: z.url().optional() });

const audit = (actor: Actor, action: string, resourceId: string, metadata?: Record<string, unknown>) =>
  db.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action, resourceType: "research_proposal", resourceId, metadata });

export async function createProposal(input: unknown, actor: Actor) {
  const parsed = proposalSchema.parse(input);
  const [proposal] = await db.insert(researchProposals).values({ id: uuidv7(), organisationId: actor.organisationId, ...parsed, ownerUserId: actor.userId }).returning();
  await audit(actor, "research.proposal_created", proposal.id, { key: parsed.key });
  return proposal;
}

export async function recordReview(proposalId: string, input: unknown, actor: Actor) {
  const parsed = reviewSchema.parse(input);
  const [proposal] = await db.select().from(researchProposals).where(and(eq(researchProposals.id, proposalId), eq(researchProposals.organisationId, actor.organisationId))).limit(1);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.ownerUserId === actor.userId) throw new Error("A proposal owner cannot review their own proposal");
  const [review] = await db.insert(researchReviews).values({ id: uuidv7(), proposalId, ...parsed, reviewedByUserId: actor.userId }).returning();
  await audit(actor, "research.review_recorded", proposalId, { kind: parsed.kind, approved: parsed.approved });
  return review;
}

async function latestApprovals(proposalId: string) {
  const reviews = await db.select().from(researchReviews).where(eq(researchReviews.proposalId, proposalId)).orderBy(desc(researchReviews.createdAt)).limit(50);
  const latest = (kind: "ethics" | "security") => reviews.find((review) => review.kind === kind);
  return { ethicsApproved: latest("ethics")?.approved ?? false, securityApproved: latest("security")?.approved ?? false };
}

export async function transitionProposal(proposalId: string, input: unknown, actor: Actor) {
  const parsed = transitionSchema.parse(input);
  return db.transaction(async (tx) => {
    const [proposal] = await tx.select().from(researchProposals).where(and(eq(researchProposals.id, proposalId), eq(researchProposals.organisationId, actor.organisationId))).limit(1);
    if (!proposal) throw new Error("Proposal not found");
    const approvals = await latestApprovals(proposalId);
    const next = {
      outcome: parsed.outcome ?? proposal.outcome,
      rejectionRationale: parsed.rejectionRationale ?? proposal.rejectionRationale,
      promotedIssueUrl: parsed.promotedIssueUrl ?? proposal.promotedIssueUrl,
    };
    assertTransition(proposal.status as ResearchStatus, parsed.status, { hypothesis: proposal.hypothesis, exitCriteria: proposal.exitCriteria, dataProtectionPlan: proposal.dataProtectionPlan, ...approvals, ...next });
    const [updated] = await tx.update(researchProposals).set({ status: parsed.status, outcome: next.outcome, outcomeUrl: parsed.outcomeUrl ?? proposal.outcomeUrl, rejectionRationale: next.rejectionRationale, promotedIssueUrl: next.promotedIssueUrl, updatedAt: new Date() }).where(eq(researchProposals.id, proposalId)).returning();
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "research.proposal_transitioned", resourceType: "research_proposal", resourceId: proposalId, metadata: { from: proposal.status, to: parsed.status } });
    return updated;
  });
}

export async function listProposals(organisationId: string, status?: ResearchStatus) {
  const filters = [eq(researchProposals.organisationId, organisationId)];
  if (status) filters.push(eq(researchProposals.status, status));
  return db.select().from(researchProposals).where(and(...filters)).orderBy(desc(researchProposals.updatedAt)).limit(200);
}
