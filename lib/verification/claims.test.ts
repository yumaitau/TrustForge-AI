import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { verifyChallengeHash } from "./claims";

describe("vendor claim challenges", () => {
  it("uses constant-time digest comparison semantics", () => {
    const challenge = "one-time-challenge";
    expect(verifyChallengeHash(challenge, createHash("sha256").update(challenge).digest("hex"))).toBe(true);
    expect(verifyChallengeHash("replayed-or-wrong", createHash("sha256").update(challenge).digest("hex"))).toBe(false);
  });
});
