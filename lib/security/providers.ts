import { sha256 } from "./intelligence";
import { safeRemoteJson } from "./remote";
import type { AdvisoryInput } from "./schemas";

type OsvVulnerability = { id: string; aliases?: string[]; summary?: string; details?: string; modified?: string; published?: string; affected?: Array<{ package?: { ecosystem?: string; name?: string }; ranges?: Array<{ events?: Array<{ introduced?: string; fixed?: string; last_affected?: string }> }> }>; database_specific?: { severity?: string }; severity?: Array<{ score?: string }>; references?: Array<{ type?: string; url?: string }> };
const severityFromOsv = (item: OsvVulnerability): AdvisoryInput["severity"] => { const value = item.database_specific?.severity?.toLowerCase(); return value === "critical" || value === "high" || value === "medium" || value === "low" ? value : "unknown"; };

/** Official OSV adapter. It is deliberately bounded to its single approved API host. */
export async function fetchOsvAdvisory(id: string): Promise<AdvisoryInput> {
  const data = await safeRemoteJson<OsvVulnerability>(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`, { allowHosts: ["api.osv.dev"] });
  const sourceUrl = data.references?.find((reference) => reference.type === "WEB")?.url ?? `https://osv.dev/vulnerability/${encodeURIComponent(data.id)}`;
  return { source: "osv", externalId: data.id, aliases: data.aliases ?? [], summary: data.summary ?? data.id, details: data.details, severity: severityFromOsv(data), affected: (data.affected ?? []).flatMap((item) => item.package?.name && item.package.ecosystem ? [{ ecosystem: item.package.ecosystem, packageName: item.package.name, ranges: item.ranges?.map((range) => JSON.stringify(range.events ?? [])) }] : []), sourceUrl, publishedAt: data.published ? new Date(data.published) : undefined, modifiedAt: data.modified ? new Date(data.modified) : undefined, snapshot: { fetchedAt: new Date(), sourceUrl: `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`, license: "CC-BY-4.0 (source-dependent)", sha256: sha256(JSON.stringify(data)), payload: data as unknown as Record<string, unknown> } };
}

export interface SecurityIntelProvider { readonly source: string; getAdvisory(externalId: string): Promise<AdvisoryInput>; }
export const providers: Record<string, SecurityIntelProvider> = { osv: { source: "osv", getAdvisory: fetchOsvAdvisory } };
