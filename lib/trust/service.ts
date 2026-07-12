import { and, desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { evidence, trustScoreComponents, trustScores } from "@/db/schema";
import { db } from "@/lib/db/client";
import { calculateTrustScore } from "./methodology";

export async function calculateAndPersistTrustScore(subjectType: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api", subjectId: string) {
  const records = await db.select().from(evidence).where(and(eq(evidence.subjectType, subjectType), eq(evidence.subjectId, subjectId), eq(evidence.status, "verified")));
  const result = calculateTrustScore(records.map((item) => ({
    evidenceId: item.id, dimension: item.dimension, value: Number(item.value), confidence: Number(item.confidence),
    rationale: item.summary ?? item.title, observedAt: item.observedAt, validUntil: item.validUntil, status: item.status,
  })));
  return db.transaction(async (tx) => {
    const id = uuidv7();
    const [score] = await tx.insert(trustScores).values({ id, subjectType, subjectId, score: String(result.score), methodologyVersion: result.methodologyVersion, explanation: { summary: `${result.explanation} Confidence: ${Math.round(result.confidence * 100)}%.`, evidenceIds: records.map((item) => item.id) } }).returning();
    await tx.insert(trustScoreComponents).values(result.components.map((component) => ({ id: uuidv7(), trustScoreId: id, dimension: component.dimension, rawScore: String(component.score), weight: String(component.weight), weightedScore: String(component.weightedScore), evidenceCount: component.evidenceIds.length, rationale: component.rationale, evidenceIds: component.evidenceIds })));
    return { score, result };
  });
}

export async function scoreHistory(subjectType: "company" | "product" | "mcp_server" | "skill" | "agent" | "model" | "api", subjectId: string, limit = 20) {
  return db.select().from(trustScores).where(and(eq(trustScores.subjectType, subjectType), eq(trustScores.subjectId, subjectId))).orderBy(desc(trustScores.calculatedAt)).limit(Math.min(Math.max(limit, 1), 100));
}
