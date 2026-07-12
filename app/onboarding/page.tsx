import { redirect } from "next/navigation";
import { createOrganisation } from "@/app/actions/organisations";
import { resolveActiveOrganisation } from "@/lib/auth/active-organisation";
import { requirePageSession } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const session = await requirePageSession();
  if (await resolveActiveOrganisation(session.user.id)) redirect("/dashboard");
  return (
    <main className="shell grid min-h-screen place-items-center py-16">
      <section className="w-full max-w-xl">
        <p className="eyebrow">Workspace setup</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Create your organisation</h1>
        <p className="muted mt-3 max-w-[60ch] leading-7">Organisation boundaries protect private research, policy decisions, and evidence. You can invite colleagues after setup.</p>
        <form action={createOrganisation} className="mt-9 border-y border-[var(--line)] py-8">
          <label htmlFor="organisation-name" className="text-sm font-medium">Organisation name</label>
          <input required minLength={2} maxLength={120} id="organisation-name" name="name" autoComplete="organization" className="field mt-2" placeholder="Acme Security" />
          <button className="button button-primary mt-5" type="submit">Create workspace</button>
        </form>
      </section>
    </main>
  );
}
