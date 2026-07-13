import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { verifyChallengeHash, verifySecretHash } from "./claims";

const sha256Hex = (value: string) => createHash("sha256").update(value).digest("hex");

describe("vendor claim challenges", () => {
  it("uses constant-time digest comparison semantics", () => {
    const challenge = "one-time-challenge";
    expect(verifyChallengeHash(challenge, sha256Hex(challenge))).toBe(true);
    expect(verifyChallengeHash("replayed-or-wrong", sha256Hex(challenge))).toBe(false);
  });
});

describe("verifySecretHash (email mailbox proof)", () => {
  const code = "mailbox-secret-code";
  const codeHash = sha256Hex(code);

  it("accepts only the exact emailed code", () => {
    expect(verifySecretHash(code, codeHash)).toBe(true);
    expect(verifySecretHash("guessed-code", codeHash)).toBe(false);
  });

  it("fails closed when the code or stored hash is missing", () => {
    // Regression: the old email path verified `code === challenge`, so a caller who
    // knew the challenge but no emailed code could self-verify. Email now requires the
    // emailed secret to match the stored codeHash; there is no verify-without-code path.
    expect(verifySecretHash(undefined, codeHash)).toBe(false);
    expect(verifySecretHash(code, undefined)).toBe(false);
    expect(verifySecretHash(undefined, undefined)).toBe(false);
  });
});
