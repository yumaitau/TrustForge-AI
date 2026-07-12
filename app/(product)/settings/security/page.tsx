import { PasskeyManager } from "./passkey-manager";
import { MfaEnrolment } from "@/components/security/mfa-enrolment";
import { requirePageSession } from "@/lib/auth/session";

export default async function SecuritySettingsPage() {
  const session = await requirePageSession();
  return <div className="mx-auto max-w-4xl"><p className="eyebrow">Account settings</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Security</h1><p className="muted mt-3 max-w-[68ch] leading-7">Use phishing-resistant passkeys and a second factor to protect verification, evidence, and moderation actions.</p><section className="mt-10"><h2 className="text-xl font-semibold">Passkeys</h2><PasskeyManager /></section>{!session.user.twoFactorEnabled ? <section className="mt-12"><h2 className="text-xl font-semibold">Authenticator app</h2><MfaEnrolment /></section> : <section className="mt-12 border-y border-[var(--line)] py-6"><h2 className="text-xl font-semibold">Authenticator app</h2><p className="mt-2 text-sm text-[var(--accent)]">Two-factor authentication is enabled.</p></section>}</div>;
}
