import { describe, expect, it } from "vitest";
import { assertTransition, type ProposalState } from "./lifecycle";

const proposal = (overrides: Partial<ProposalState> = {}): ProposalState => ({
  hypothesis: "Federated trust attestations reduce duplicate verification effort.",
  exitCriteria: "Prototype exchanges attestations across two registries with signed provenance.",
  dataProtectionPlan: "Synthetic subjects only; no production user or vendor records enter the dataset.",
  ethicsApproved: false,
  securityApproved: false,
  outcome: null,
  rejectionRationale: null,
  promotedIssueUrl: null,
  ...overrides,
});

describe("assertTransition", () => {
  it("requires hypothesis, exit criteria, and data protection before submission", () => {
    expect(() => assertTransition("draft", "submitted", proposal())).not.toThrow();
    expect(() => assertTransition("draft", "submitted", proposal({ hypothesis: "tbd" }))).toThrow(/hypothesis/);
    expect(() => assertTransition("draft", "submitted", proposal({ exitCriteria: "" }))).toThrow(/exit criteria/);
    expect(() => assertTransition("draft", "submitted", proposal({ dataProtectionPlan: "n/a" }))).toThrow(/data-protection/);
  });

  it("blocks approval until ethics and security reviews pass", () => {
    expect(() => assertTransition("in_review", "approved", proposal())).toThrow(/ethics and security/);
    expect(() => assertTransition("in_review", "approved", proposal({ ethicsApproved: true }))).toThrow(/ethics and security/);
    expect(() => assertTransition("in_review", "approved", proposal({ ethicsApproved: true, securityApproved: true }))).not.toThrow();
  });

  it("requires a published outcome to complete and a delivery issue to promote", () => {
    expect(() => assertTransition("in_progress", "completed", proposal())).toThrow(/published outcome/);
    expect(() => assertTransition("in_progress", "completed", proposal({ outcome: "Prototype succeeded; write-up published internally." }))).not.toThrow();
    expect(() => assertTransition("completed", "promoted", proposal())).toThrow(/delivery issue/);
    expect(() => assertTransition("completed", "promoted", proposal({ promotedIssueUrl: "https://github.com/yumaitau/TrustForge-AI/issues/99" }))).not.toThrow();
  });

  it("retains rationale for every rejection and seals terminal states", () => {
    expect(() => assertTransition("in_review", "rejected", proposal())).toThrow(/rationale/);
    expect(() => assertTransition("in_review", "rejected", proposal({ rejectionRationale: "Duplicates existing federation research." }))).not.toThrow();
    expect(() => assertTransition("rejected", "draft", proposal())).toThrow(/cannot move/);
    expect(() => assertTransition("promoted", "in_progress", proposal())).toThrow(/cannot move/);
  });

  it("rejects skipped stages", () => {
    expect(() => assertTransition("draft", "approved", proposal({ ethicsApproved: true, securityApproved: true }))).toThrow(/cannot move/);
    expect(() => assertTransition("submitted", "completed", proposal({ outcome: "A published outcome exists here." }))).toThrow(/cannot move/);
  });
});
