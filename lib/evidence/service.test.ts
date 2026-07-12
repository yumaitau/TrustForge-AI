import { describe, expect, it } from "vitest";
import { assertEvidenceTransition, evidenceContentHash } from "./service";

const input = { subjectType: "company" as const, subjectId: "019f54f4-214e-71cf-b5d6-2770618831c5", type: "domain", dimension: "transparency" as const, value: 80, title: "Domain verified", source: "registry" as const, confidence: 1, observedAt: new Date("2026-01-01T00:00:00Z") };

describe("evidence invariants", () => {
  it("hashes canonical evidence deterministically", () => expect(evidenceContentHash(input)).toBe(evidenceContentHash({ ...input })));
  it("permits adjudication but prevents rewriting terminal evidence", () => {
    expect(() => assertEvidenceTransition("pending", "verified")).not.toThrow();
    expect(() => assertEvidenceTransition("verified", "rejected")).toThrow(/Invalid evidence transition/);
    expect(() => assertEvidenceTransition("expired", "verified")).toThrow(/Invalid evidence transition/);
  });
});
