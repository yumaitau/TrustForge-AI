import { and, desc, eq, isNull } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { fraudSignals, moderationCases, reviews, reviewVotes, suggestedEdits } from "@/db/schema";
import { db } from "@/lib/db/client";
import { detectReviewFraud, reviewContentHash } from "@/lib/fraud/detector";
import { recordReputation, reputationForUser } from "@/lib/reputation/service";

export const reviewInputSchema = z.object({
  subjectType: z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]),
  subjectId: z.uuid(), title: z.string().trim().min(5).max(140), body: z.string().trim().min(50).max(10_000),
  rating: z.number().int().min(1).max(5), verifiedUse: z.boolean().default(false), useCase: z.string().trim().max(280).optional(),
});

export async function submitReview(raw: unknown, authorUserId: string) {
  const input = reviewInputSchema.parse(raw);
  const hash = reviewContentHash(input.title, input.body);
  const reputation = await reputationForUser(authorUserId);
  const recent = await db.select({ userId: reviews.authorUserId, title: reviews.title, body: reviews.body, createdAt: reviews.createdAt }).from(reviews).where(and(eq(reviews.subjectType, input.subjectType), eq(reviews.subjectId, input.subjectId), isNull(reviews.deletedAt))).orderBy(desc(reviews.createdAt)).limit(50);
  const findings = detectReviewFraud([...recent.map((item) => ({ userId: item.userId, content: `${item.title}\n${item.body}`, createdAt: item.createdAt })), { userId: authorUserId, content: `${input.title}\n${input.body}`, createdAt: new Date() }]);
  const result = await db.transaction(async (tx) => {
    const id = uuidv7();
    const [review] = await tx.insert(reviews).values({ id, ...input, authorUserId, contentHash: hash, reputationWeight: String(reputation.weight), status: findings.length ? "pending" : "published", publishedAt: findings.length ? null : new Date() }).returning();
    if (findings.length) await tx.insert(fraudSignals).values(findings.map((finding) => ({ id: uuidv7(), subjectType: "review", subjectId: id, ...finding, confidence: String(finding.confidence) })));
    return { review, findings };
  });
  if (result.review.status === "published") await recordReputation({ userId: authorUserId, event: "review_published", reason: "Structured review published", sourceType: "review", sourceId: result.review.id });
  return result;
}

export async function voteOnReview(input: { reviewId: string; userId: string; helpful: boolean }) {
  const [review] = await db.select({ authorUserId: reviews.authorUserId }).from(reviews).where(eq(reviews.id, input.reviewId)).limit(1);
  if (!review) throw new Error("Review not found");
  if (review.authorUserId === input.userId) throw new Error("Authors cannot vote on their own reviews");
  const reputation = await reputationForUser(input.userId);
  const [vote] = await db.insert(reviewVotes).values({ ...input, weight: String(reputation.weight) }).onConflictDoUpdate({ target: [reviewVotes.reviewId, reviewVotes.userId], set: { helpful: input.helpful, weight: String(reputation.weight) } }).returning();
  if (input.helpful) {
    await recordReputation({ userId: review.authorUserId, event: "review_helpful", reason: "Review received a helpful vote", sourceType: "review_vote", sourceId: input.reviewId });
  }
  return vote;
}

export async function reportContent(input: { reporterUserId?: string; targetType: string; targetId: string; reason: string; details?: string }) {
  const [moderationCase] = await db.insert(moderationCases).values({ id: uuidv7(), ...input }).returning();
  return moderationCase;
}

export async function appealReview(input: { reviewId: string; userId: string; reason: string }) {
  return db.transaction(async (tx) => {
    const [review] = await tx.update(reviews).set({ status: "appealed", updatedAt: new Date() }).where(and(eq(reviews.id, input.reviewId), eq(reviews.authorUserId, input.userId))).returning();
    if (!review) throw new Error("Review not found or appeal not permitted");
    const [moderationCase] = await tx.insert(moderationCases).values({ id: uuidv7(), reporterUserId: input.userId, targetType: "review", targetId: input.reviewId, reason: "appeal", details: input.reason, status: "appealed" }).returning();
    return { review, moderationCase };
  });
}

export async function submitSuggestedEdit(input: { subjectType: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api"; subjectId: string; userId: string; patch: Record<string, unknown>; rationale: string }) {
  const [edit] = await db.insert(suggestedEdits).values({ id: uuidv7(), subjectType: input.subjectType, subjectId: input.subjectId, submittedByUserId: input.userId, patch: input.patch, rationale: input.rationale }).returning();
  return edit;
}

export async function adjudicateSuggestedEdit(input: { editId: string; reviewerUserId: string; status: "published" | "rejected" }) {
  const [edit] = await db.update(suggestedEdits).set({ status: input.status, reviewedByUserId: input.reviewerUserId, reviewedAt: new Date() }).where(eq(suggestedEdits.id, input.editId)).returning();
  if (!edit) throw new Error("Suggested edit not found");
  return edit;
}

export async function resolveModerationCase(input: { caseId: string; moderatorUserId: string; status: "investigating" | "actioned" | "dismissed" | "resolved"; resolution?: string }) {
  const [moderationCase] = await db.update(moderationCases).set({ status: input.status, assignedToUserId: input.moderatorUserId, resolution: input.resolution, updatedAt: new Date() }).where(eq(moderationCases.id, input.caseId)).returning();
  if (!moderationCase) throw new Error("Moderation case not found");
  return moderationCase;
}
