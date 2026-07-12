import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { aiEvaluationCases, aiEvaluationResults, aiEvaluationRuns, aiEvaluationSuites, auditEvents } from "@/db/schema";
import { db } from "@/lib/db/client";
import { aiEvaluationRunInputSchema, aiEvaluationSuiteInputSchema } from "./schemas";

export async function createEvaluationSuite(input: unknown, actor: { userId: string; organisationId: string }) {
  const parsed = aiEvaluationSuiteInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const suiteId = uuidv7(); const [suite] = await tx.insert(aiEvaluationSuites).values({ id: suiteId, organisationId: actor.organisationId, name: parsed.name, kind: parsed.kind, version: parsed.version, methodology: parsed.methodology, sensitive: parsed.sensitive, disclosurePolicy: parsed.disclosurePolicy }).returning();
    const cases = await tx.insert(aiEvaluationCases).values(parsed.cases.map((item) => ({ id: uuidv7(), suiteId, ...item }))).returning();
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "ai_evaluation.suite_created", resourceType: "ai_evaluation_suite", resourceId: suiteId, metadata: { kind: suite.kind, version: suite.version, caseCount: cases.length } });
    return { suite, cases };
  });
}

export async function recordEvaluationRun(input: unknown, actor: { userId: string; organisationId: string }) {
  const parsed = aiEvaluationRunInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const [suite] = await tx.select().from(aiEvaluationSuites).where(eq(aiEvaluationSuites.id, parsed.suiteId)).limit(1); if (!suite || suite.organisationId !== actor.organisationId) throw new Error("Evaluation suite not found");
    if (parsed.environment.executionMode !== "controlled_lab" && !suite.sensitive) throw new Error("Imported results require a suite marked as sensitive and a documented chain of custody");
    const score = parsed.results.reduce((total, result) => total + result.score, 0) / parsed.results.length;
    const runId = uuidv7(); const [run] = await tx.insert(aiEvaluationRuns).values({ id: runId, suiteId: parsed.suiteId, subjectType: parsed.subjectType, subjectId: parsed.subjectId, environment: parsed.environment, observedAt: parsed.observedAt, completedAt: new Date(), score: String(score), claimSummary: parsed.claimSummary, status: "succeeded", createdByUserId: actor.userId }).returning();
    const results = await tx.insert(aiEvaluationResults).values(parsed.results.map((result) => ({ id: uuidv7(), runId, ...result, score: String(result.score), disclosureRestricted: result.disclosureRestricted || suite.sensitive }))).returning();
    await tx.insert(auditEvents).values({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "ai_evaluation.run_recorded", resourceType: "ai_evaluation_run", resourceId: runId, metadata: { suiteId: suite.id, observedScore: score, resultCount: results.length } });
    return { run, results };
  });
}

export async function listEvaluationRuns(subjectType: string, subjectId: string) { return db.select().from(aiEvaluationRuns).where(and(eq(aiEvaluationRuns.subjectType, subjectType as typeof aiEvaluationRuns.subjectType.enumValues[number]), eq(aiEvaluationRuns.subjectId, subjectId))).orderBy(aiEvaluationRuns.createdAt).limit(200); }
