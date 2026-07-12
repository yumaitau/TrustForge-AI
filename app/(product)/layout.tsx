import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, FileCheck2, LayoutDashboard, MessageSquare, Search, Settings, ShieldCheck } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { organisations } from "@/db/schema";
import { resolveActiveOrganisation } from "@/lib/auth/active-organisation";
import { requirePageSession } from "@/lib/auth/session";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/registry", label: "Registry", icon: Database },
  { href: "/search", label: "Search", icon: Search },
  { href: "/evidence", label: "Evidence", icon: FileCheck2 },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/settings/security", label: "Security", icon: Settings },
];

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession();
  const organisation = await resolveActiveOrganisation(session.user.id);
  if (!organisation) redirect("/onboarding");
  const [policy] = await db.select({ securityPolicy: organisations.securityPolicy }).from(organisations).where(eq(organisations.id, organisation.id)).limit(1);
  const mfaRequired = policy?.securityPolicy.mfaMode === "all_users_required" || (policy?.securityPolicy.mfaMode === "admin_required" && ["owner", "admin"].includes(organisation.role));
  if (mfaRequired && !session.user.twoFactorEnabled) redirect("/mfa");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[var(--surface)] px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold"><span className="grid size-8 place-items-center rounded-md bg-[var(--accent)] text-[var(--accent-ink)]"><ShieldCheck size={18} /></span>TrustForge AI</Link>
        <nav className="mt-7 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Workspace">
          {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text)]"><Icon size={17} />{label}</Link>)}
        </nav>
        <div className="mt-7 hidden border-t border-[var(--line)] pt-5 lg:block"><p className="truncate text-sm font-medium">{organisation.name}</p><p className="muted mt-1 truncate text-xs">{session.user.email} · {organisation.role}</p></div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
