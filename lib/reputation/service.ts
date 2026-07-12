import { eq, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { reputationLedger } from "@/db/schema";
import { db } from "@/lib/db/client";

export type ReputationEvent = "review_published" | "review_helpful" | "edit_accepted" | "evidence_verified" | "security_research" | "moderation_upheld" | "penalty";

export const REPUTATION_POINTS: Readonly<Record<Exclude<ReputationEvent, "penalty">, number>> = {
  review_published: 5, review_helpful: 2, edit_accepted: 10, evidence_verified: 15, security_research: 30, moderation_upheld: 8,
};

export function reputationWeight(points: number) {
  return Number(Math.min(3, 1 + Math.sqrt(Math.max(0, points)) / 20).toFixed(4));
}

export async function reputationForUser(userId: string) {
  const [result] = await db.select({ points: sql<number>`coalesce(sum(${reputationLedger.points}), 0)::int` }).from(reputationLedger).where(eq(reputationLedger.userId, userId));
  const points = result?.points ?? 0;
  return { points, weight: reputationWeight(points) };
}

export async function recordReputation(input: { userId: string; event: ReputationEvent; points?: number; reason: string; sourceType: string; sourceId: string }) {
  const points = input.event === "penalty" ? Math.min(-1, input.points ?? -5) : REPUTATION_POINTS[input.event];
  const [entry] = await db.insert(reputationLedger).values({ id: uuidv7(), ...input, points }).onConflictDoNothing().returning();
  return entry ?? null;
}
