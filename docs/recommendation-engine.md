# Explainable recommendation engine

Phase 7 delivers an assistant that answers natural-language trust questions with policy constraints, evidence citations, comparisons, alternatives, and explicit uncertainty.

## Design principles

- **Hard constraints are deterministic.** Minimum score, minimum confidence, per-dimension minimums, verification requirements, and open-critical-finding exclusions are evaluated in code (`lib/recommendation/engine.ts`), never by a model. Every evaluation records a pass/fail and a human-readable reason.
- **Recommendations cite current evidence.** Candidates are scored on demand from currently verified evidence using the published methodology (`lib/trust/methodology.ts`); citations are the evidence identifiers behind each score component.
- **Uncertainty and conflicts are shown.** Missing dimensions, evidence confidence, and materially contradictory evidence are surfaced on every entry. Low-confidence recommendations carry an explicit provisional caveat.
- **Alternatives are inspectable.** Eligible runners-up and ineligible candidates (with the exact constraint reasons that excluded them) are always part of the result.
- **Registry text is untrusted data, never instructions.** All registry- and evidence-derived text passes through `sanitizeUntrustedText`, which strips control characters, redacts instruction-like fragments, and bounds length (prompt-injection defence).
- **Grounding is verified.** Synthesized answers may only cite evidence identifiers present in the structured result. `verifyGroundedAnswer` rejects any other citation; ungrounded output is replaced by the deterministic renderer (hallucination defence).

## Model abstraction

`lib/recommendation/synthesis.ts` defines an `AssistantModel` interface with a deterministic template renderer as the default implementation. External model providers can be registered behind `resolveModel()`; their output must pass the grounding check before being returned.

## Surfaces

- **REST**: `POST /api/v1/recommendations` with `{ question, subjectType?, query?, candidates?, constraints?, limit? }`.
- **MCP**: `recommend_trustworthy_subjects` tool on the TrustForge MCP server (read-only, idempotent), using flat filters mapped onto hard constraints.

## Evaluations

`lib/recommendation/engine.test.ts` and `lib/recommendation/synthesis.test.ts` include prompt-injection evaluations (instruction-like registry text is redacted, not relayed) and hallucination evaluations (citations must resolve to real evidence; fabricated citations are flagged).

## Decision auditability

The result is fully structured: question, methodology version, constraint evaluations with reasons, citations, uncertainty, conflicts, alternatives, and caveats. Callers can persist or export the entire object; nothing in the answer text exists outside the structured result.
