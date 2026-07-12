import { listCompanies, listProducts } from "@/lib/registry/repository";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; verified?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const [companyResult, productResult] = query.length >= 2 ? await Promise.all([listCompanies({ query, limit: 20 }), listProducts({ query, limit: 20 })]) : [{ items: [] }, { items: [] }];
  const results = [...companyResult.items.map((item) => ({ id: item.id, name: item.displayName, type: "Company", verification: item.verificationLevel, description: item.description })), ...productResult.items.map((item) => ({ id: item.id, name: item.name, type: item.type.replaceAll("_", " "), verification: item.verificationLevel, description: item.description }))].filter((item) => params.verified !== "true" || item.verification !== "unverified");
  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Discovery</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Search the trust registry</h1>
      <form className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]" role="search"><label className="sr-only" htmlFor="registry-search">Search registry</label><input className="field" id="registry-search" name="q" defaultValue={query} placeholder="Company, product, model, API, skill, or MCP server" /><label className="flex min-h-12 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 text-sm"><input type="checkbox" name="verified" value="true" defaultChecked={params.verified === "true"} className="size-4 accent-[var(--accent)]" /> Verified only</label><button className="button button-primary" type="submit">Search</button></form>
      <p aria-live="polite" className="muted mt-5 text-sm">{query.length < 2 ? "Enter at least two characters." : `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”.`}</p>
      <section className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]" aria-label="Search results">{results.map((result) => <article key={result.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-start"><div><h2 className="font-medium">{result.name}</h2><p className="muted mt-1 max-w-[70ch] text-sm">{result.description ?? "No summary has been submitted yet."}</p></div><div className="flex gap-2 text-xs"><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 capitalize">{result.type}</span><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 capitalize">{result.verification.replaceAll("_", " ")}</span></div></article>)}{query.length >= 2 && results.length === 0 ? <div className="py-16 text-center"><strong className="font-medium">No matching subjects yet.</strong><p className="muted mt-2 text-sm">Try a broader name or remove the verification filter.</p></div> : null}</section>
    </div>
  );
}
