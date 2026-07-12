import { describe, expect, it } from "vitest";
import { calculateTax, taxRegionFor } from "./tax";

describe("calculateTax", () => {
  it("backs GST out of tax-inclusive Australian prices", () => {
    const result = calculateTax(11_000, "au");
    expect(result.region.kind).toBe("gst");
    expect(result.taxMinorUnits).toBe(1_000);
    expect(result.netMinorUnits).toBe(10_000);
    expect(result.totalMinorUnits).toBe(11_000);
  });

  it("adds nothing where the platform collects no tax", () => {
    const result = calculateTax(9_999, "US");
    expect(result.taxMinorUnits).toBe(0);
    expect(result.totalMinorUnits).toBe(9_999);
  });

  it("falls back to no platform-collected tax for unknown regions", () => {
    const result = calculateTax(5_000, "BR");
    expect(result.region.countryCode).toBe("BR");
    expect(result.region.rateBasisPoints).toBe(0);
    expect(result.totalMinorUnits).toBe(5_000);
  });

  it("keeps net, tax, and total consistent for every region", () => {
    for (const code of ["AU", "NZ", "GB", "DE", "FR", "SG", "US"]) {
      const result = calculateTax(12_345, code);
      expect(result.netMinorUnits + result.taxMinorUnits).toBe(result.totalMinorUnits);
      expect(Number.isInteger(result.taxMinorUnits)).toBe(true);
    }
  });

  it("rejects non-integer and negative prices", () => {
    expect(() => calculateTax(10.5, "AU")).toThrow(/minor units/);
    expect(() => calculateTax(-1, "AU")).toThrow(/minor units/);
  });

  it("normalises country codes", () => {
    expect(taxRegionFor("gb").label).toContain("United Kingdom");
  });
});
