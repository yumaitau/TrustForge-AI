import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { aiEvaluationRunInputSchema, findingInputSchema, sbomInputSchema } from "./schemas";

const hash = createHash("sha256").update("fixture").digest("hex"); const id = "018f2d1c-7eb7-7fcd-a83d-3e6d0f9bfab3";
describe("security input contracts", () => {
  it("requires attributable source snapshots for findings", () => expect(findingInputSchema.safeParse({ subjectType: "product", subjectId: id, scanner: "osv", fingerprint: "finding-123", title: "A finding", rawSnapshot: { fetchedAt: new Date(), sha256: hash, payload: {} } }).success).toBe(true));
  it("makes SBOM imports reproducible and bounded", () => expect(sbomInputSchema.safeParse({ subjectType: "product", subjectId: id, format: "cyclonedx", documentName: "bom.json", documentHash: hash, sourceSnapshot: { fetchedAt: new Date(), sha256: hash, payload: {} }, components: [{ packageName: "zod", version: "4.0.0" }] }).success).toBe(true));
  it("requires an immutable environment hash for controlled lab results", () => expect(aiEvaluationRunInputSchema.safeParse({ subjectType: "model", subjectId: id, suiteId: id, observedAt: new Date(), environment: { targetVersion: "2026-07", environmentHash: hash, executionMode: "controlled_lab" }, results: [{ outcome: "pass", score: 90, observedBehavior: "The tested policy boundary held under the controlled fixture." }] }).success).toBe(true));
});
