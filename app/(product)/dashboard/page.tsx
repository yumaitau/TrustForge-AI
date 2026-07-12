import Link from "next/link";
import { ArrowRight, Database, FileCheck2, ShieldCheck } from "lucide-react";

const nextActions = [
  { title: "Search the registry", detail: "Find companies and AI products across the public trust index.", href: "/search", icon: Database },
  { title: "Inspect evidence", detail: "Understand which facts support a score and which dimensions remain uncertain.", href: "/registry", icon: FileCheck2 },
  { title: "Review methodology", detail: "See how deterministic scores, confidence, and missing evidence are handled.", href: "/#methodology", icon: ShieldCheck },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Workspace overview</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Trust decisions start with evidence.</h1>
      <p className="muted mt-3 max-w-[68ch] leading-7">The Phase 1 workspace connects the registry, search, methodology, and organisation boundary. Start by finding a subject to assess.</p>
      <section className="mt-12 border-t border-[var(--line)]" aria-labelledby="next-actions"><h2 id="next-actions" className="sr-only">Next actions</h2>{nextActions.map(({ title, detail, href, icon: Icon }, index) => <Link key={title} href={href} className="group grid gap-4 border-b border-[var(--line)] py-6 sm:grid-cols-[40px_1fr_auto] sm:items-center"><span className="grid size-10 place-items-center rounded-md bg-[var(--surface)] text-[var(--accent)]"><Icon size={19} /></span><span><strong className="font-medium">{title}</strong><span className="muted mt-1 block text-sm">{detail}</span></span><span className="muted flex items-center gap-2 text-sm group-hover:text-[var(--text)]">0{index + 1}<ArrowRight size={16} /></span></Link>)}</section>
    </div>
  );
}
