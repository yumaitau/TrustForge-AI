import { describe, expect, it } from "vitest";
import { calculateTrustScore } from "@/lib/trust/methodology";
import { recommend, type RecommendationCandidate } from "./engine";
import { deterministicModel, renderAnswer, verifyGroundedAnswer } from "./synthesis";

const scored: RecommendationCandidate = {
  subjectType: "product",
  subjectId: "subject-1",
  name: "Aurora Coding Assistant",
  verificationLevel: "verified",
  trust: calculateTrustScore([
    { evidenceId: "ev-1", dimension: "security", value: 88, confidence: 1, rationale: "Independent audit passed." },
    { evidenceId: "ev-2", dimension: "privacy", value: 72, confidence: 0.8, rationale: "Privacy policy assessed." },
  ]),
  openFindings: [],
};

const result = recommend({ question: "Which coding assistant can we trust for source access?", constraints: [{ kind: "min_score", value: 40 }] }, [scored]);

describe("renderAnswer", () => {
  it("includes recommendation, citations, uncertainty, and caveats", () => {
    const answer = renderAnswer({ question: result.question, result });
    expect(answer).toContain("Aurora Coding Assistant");
    expect(answer).toContain("[evidence:ev-1]");
    expect(answer).toContain("[evidence:ev-2]");
    expect(answer).toContain("**Uncertainty:**");
    expect(answer).toContain("not a certification");
    expect(answer).toContain("untrusted data");
  });

  it("states plainly when nothing qualifies", () => {
    const empty = recommend({ question: "Anything eligible here at all?", constraints: [{ kind: "min_score", value: 99 }] }, [scored]);
    const answer = renderAnswer({ question: empty.question, result: empty });
    expect(answer).toContain("none — no candidate satisfies every hard constraint");
    expect(answer).toContain("**Did not qualify:**");
  });
});

describe("verifyGroundedAnswer (hallucination evaluation)", () => {
  it("accepts the deterministic model output as fully grounded", async () => {
    const answer = await deterministicModel.synthesize({ question: result.question, result });
    const grounding = verifyGroundedAnswer(answer, result);
    expect(grounding.unknown).toEqual([]);
    expect(grounding.cited).toContain("ev-1");
  });

  it("flags citations that reference evidence that does not exist", () => {
    const hallucinated = "This product is certified safe [evidence:ev-1] [evidence:made-up-id].";
    const grounding = verifyGroundedAnswer(hallucinated, result);
    expect(grounding.unknown).toEqual(["made-up-id"]);
  });
});
