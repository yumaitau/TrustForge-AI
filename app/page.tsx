import { ArrowRight, Check, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

const evidence = [
  ["Domain ownership", "Verified", "+4.0"],
  ["Signed releases", "Verified", "+6.5"],
  ["Security policy", "Current", "+3.5"],
  ["Dependency risk", "2 findings", "−2.0"],
];

export default function Home() {
  return (
    <main>
      <header className="shell flex min-h-20 items-center justify-between border-b border-[var(--line)]">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-[-.02em]" aria-label="TrustForge AI home">
          <span className="grid size-8 place-items-center rounded-md bg-[var(--accent)] text-[var(--accent-ink)]"><ShieldCheck size={18} /></span>
          TrustForge AI
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link className="button max-sm:hidden" href="#methodology">Methodology</Link>
          <Link className="button button-secondary" href="/sign-in">Sign in</Link>
        </nav>
      </header>

      <section className="shell grid min-h-[690px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <p className="eyebrow mb-7">The evidence layer for AI</p>
          <h1 className="max-w-[820px] text-[clamp(3.1rem,7vw,6.8rem)] font-semibold leading-[.91] tracking-[-.065em]">
            Know what you can trust.
          </h1>
          <p className="muted mt-8 max-w-[62ch] text-lg leading-8">
            Verify AI companies, products, MCP servers, agents, models, APIs, and skills through transparent scores linked to current evidence.
          </p>
          <form action="/search" className="mt-10 flex max-w-[610px] gap-2" role="search">
            <label className="sr-only" htmlFor="search">Search the AI trust registry</label>
            <div className="flex min-h-14 flex-1 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 focus-within:border-[var(--accent)]">
              <Search size={19} className="muted" aria-hidden="true" />
              <input id="search" name="q" className="w-full border-0 bg-transparent outline-none placeholder:text-[var(--muted)]" placeholder="Search a company, tool, model, or MCP server" />
            </div>
            <button className="button button-primary" type="submit">Search <ArrowRight size={17} /></button>
          </form>
          <p className="muted mt-4 text-sm">Registry search arrives in Phase 1. Start with the methodology.</p>
        </div>

        <div aria-label="Example transparent trust score" className="border-y border-[var(--line)] py-8 lg:border lg:p-8">
          <div className="flex items-start justify-between gap-6">
            <div><p className="eyebrow">Illustrative profile</p><h2 className="mt-3 text-2xl font-semibold">GitHub MCP Server</h2><p className="muted mt-1">Developer tooling · Open source</p></div>
            <div className="text-right"><p className="text-5xl font-semibold tracking-[-.06em]">86</p><p className="muted text-xs">of 100</p></div>
          </div>
          <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]" role="progressbar" aria-label="Trust score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={86}><div className="h-full w-[86%] bg-[var(--accent)]" /></div>
          <div className="mt-7 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {evidence.map(([label, status, impact]) => (
              <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4 text-sm">
                <span>{label}</span><span className="muted flex items-center gap-1.5"><Check size={14} aria-hidden="true" />{status}</span><span className="w-10 text-right tabular-nums">{impact}</span>
              </div>
            ))}
          </div>
          <p className="muted mt-5 text-sm leading-6">Every contribution is attributable, time-bound, versioned, and open to challenge.</p>
        </div>
      </section>

      <section id="methodology" className="border-t border-[var(--line)] bg-[var(--surface)] py-24">
        <div className="shell grid gap-14 lg:grid-cols-[.7fr_1.3fr]">
          <div><p className="eyebrow">Trust, explained</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em]">No black boxes.</h2></div>
          <div className="grid gap-10 sm:grid-cols-2">
            <article><p className="text-sm font-semibold text-[var(--accent)]">01</p><h3 className="mt-3 text-xl font-semibold">Evidence before opinion</h3><p className="muted mt-3 leading-7">Scores cite provenance, observation time, confidence, and expiry. Missing evidence stays visibly missing.</p></article>
            <article><p className="text-sm font-semibold text-[var(--accent)]">02</p><h3 className="mt-3 text-xl font-semibold">Versioned methodology</h3><p className="muted mt-3 leading-7">Weighting and calculation rules are published, reproducible, and retained with every score.</p></article>
            <article><p className="text-sm font-semibold text-[var(--accent)]">03</p><h3 className="mt-3 text-xl font-semibold">Continuous verification</h3><p className="muted mt-3 leading-7">Repositories, releases, domains, advisories, certificates, and disclosures are re-evaluated over time.</p></article>
            <article><p className="text-sm font-semibold text-[var(--accent)]">04</p><h3 className="mt-3 text-xl font-semibold">Human and agent ready</h3><p className="muted mt-3 leading-7">The same registry will serve the web experience, REST, GraphQL, and TrustForge&apos;s own MCP server.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
