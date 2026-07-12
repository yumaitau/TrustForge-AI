export type TaxKind = "gst" | "vat" | "none";

export type TaxRegion = {
  countryCode: string;
  label: string;
  kind: TaxKind;
  /** Basis points, e.g. 1000 = 10%. Integer so calculations stay exact. */
  rateBasisPoints: number;
  /** Whether displayed offer prices in this region must already include tax. */
  pricesTaxInclusive: boolean;
};

export const TAX_REGIONS: Readonly<Record<string, TaxRegion>> = {
  AU: { countryCode: "AU", label: "Australia GST", kind: "gst", rateBasisPoints: 1000, pricesTaxInclusive: true },
  NZ: { countryCode: "NZ", label: "New Zealand GST", kind: "gst", rateBasisPoints: 1500, pricesTaxInclusive: true },
  GB: { countryCode: "GB", label: "United Kingdom VAT", kind: "vat", rateBasisPoints: 2000, pricesTaxInclusive: true },
  DE: { countryCode: "DE", label: "Germany VAT", kind: "vat", rateBasisPoints: 1900, pricesTaxInclusive: true },
  FR: { countryCode: "FR", label: "France VAT", kind: "vat", rateBasisPoints: 2000, pricesTaxInclusive: true },
  SG: { countryCode: "SG", label: "Singapore GST", kind: "gst", rateBasisPoints: 900, pricesTaxInclusive: true },
  // US sales tax is state-level and collected via a registered facilitator; the platform records zero here.
  US: { countryCode: "US", label: "United States (state-level)", kind: "none", rateBasisPoints: 0, pricesTaxInclusive: false },
};

const FALLBACK: TaxRegion = { countryCode: "ZZ", label: "No platform-collected tax", kind: "none", rateBasisPoints: 0, pricesTaxInclusive: false };

export function taxRegionFor(countryCode: string): TaxRegion {
  return TAX_REGIONS[countryCode.toUpperCase()] ?? { ...FALLBACK, countryCode: countryCode.toUpperCase() };
}

export type TaxCalculation = {
  region: TaxRegion;
  /** Price excluding tax, minor units. */
  netMinorUnits: number;
  taxMinorUnits: number;
  /** Amount payable, minor units. */
  totalMinorUnits: number;
};

/**
 * Deterministic integer tax calculation in minor units. In tax-inclusive
 * regions the offer price is the total and tax is backed out; elsewhere tax
 * is added on top. Rounding is half-up on the tax component.
 */
export function calculateTax(priceMinorUnits: number, countryCode: string): TaxCalculation {
  if (!Number.isInteger(priceMinorUnits) || priceMinorUnits < 0) throw new Error("Price must be a non-negative integer in minor units");
  const region = taxRegionFor(countryCode);
  if (region.rateBasisPoints === 0) return { region, netMinorUnits: priceMinorUnits, taxMinorUnits: 0, totalMinorUnits: priceMinorUnits };
  if (region.pricesTaxInclusive) {
    const taxMinorUnits = Math.round((priceMinorUnits * region.rateBasisPoints) / (10_000 + region.rateBasisPoints));
    return { region, netMinorUnits: priceMinorUnits - taxMinorUnits, taxMinorUnits, totalMinorUnits: priceMinorUnits };
  }
  const taxMinorUnits = Math.round((priceMinorUnits * region.rateBasisPoints) / 10_000);
  return { region, netMinorUnits: priceMinorUnits, taxMinorUnits, totalMinorUnits: priceMinorUnits + taxMinorUnits };
}
