import { redirect } from "next/navigation";
import { MfaEnrolment } from "@/components/security/mfa-enrolment";
import { requirePageSession } from "@/lib/auth/session";

export default async function MfaPage() {
  const session = await requirePageSession();
  if (session.user.twoFactorEnabled) redirect("/dashboard");
  return <main className="shell py-16"><div className="max-w-2xl"><p className="eyebrow">Account security</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Two-factor authentication required</h1><p className="muted mt-3 leading-7">Your organisation requires an authenticator-generated code for privileged access.</p><MfaEnrolment returnTo="/dashboard" /></div></main>;
}
