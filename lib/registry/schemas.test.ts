import { describe, expect, it } from "vitest";
import { canonicalSlug } from "./schemas";

const ID = "0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b";

describe("canonicalSlug", () => {
  it("lowercases, collapses non-alphanumerics, and appends the id prefix", () => {
    expect(canonicalSlug("Acme Security, Inc.", ID)).toBe(`acme-security-inc-${ID.slice(0, 8)}`);
  });

  it("strips non-ASCII characters", () => {
    expect(canonicalSlug("Café Modèle", ID)).toBe(`cafe-modele-${ID.slice(0, 8)}`);
  });

  it("falls back to 'subject' when nothing survives slugification", () => {
    expect(canonicalSlug("公司", ID)).toBe(`subject-${ID.slice(0, 8)}`);
    expect(canonicalSlug("!!!", ID)).toBe(`subject-${ID.slice(0, 8)}`);
  });

  it("trims leading/trailing separators and caps the base length", () => {
    const slug = canonicalSlug(`  ${"a".repeat(80)}  `, ID);
    expect(slug).toBe(`${"a".repeat(52)}-${ID.slice(0, 8)}`);
    expect(slug.startsWith("-")).toBe(false);
  });
});
