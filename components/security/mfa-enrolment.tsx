"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type Enrolment = { totpURI: string; backupCodes: string[] };

export function MfaEnrolment({ returnTo = "/settings/security" }: { returnTo?: string }) {
  const router = useRouter();
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function enable(formData: FormData) {
    setPending(true); setError(null);
    const result = await authClient.twoFactor.enable({ password: String(formData.get("password")), issuer: "TrustForge AI" });
    setPending(false);
    if (result.error) { setError(result.error.message ?? "Two-factor enrolment could not start."); return; }
    if (result.data) setEnrolment({ totpURI: result.data.totpURI, backupCodes: result.data.backupCodes });
  }

  async function verify(formData: FormData) {
    setPending(true); setError(null);
    const result = await authClient.twoFactor.verifyTotp({ code: String(formData.get("code")), trustDevice: true });
    setPending(false);
    if (result.error) { setError(result.error.message ?? "The verification code was not accepted."); return; }
    router.push(returnTo); router.refresh();
  }

  return (
    <div className="mt-7 border-y border-[var(--line)] py-7">
      {!enrolment ? <form action={enable} className="max-w-md space-y-4"><div><label htmlFor="mfa-password" className="text-sm font-medium">Confirm password</label><input id="mfa-password" name="password" type="password" autoComplete="current-password" required className="field mt-2" /></div><button className="button button-primary" disabled={pending}>{pending ? "Preparing…" : "Set up authenticator"}</button></form> : <div className="space-y-6"><div><h2 className="font-medium">Add this account to your authenticator</h2><p className="muted mt-2 max-w-[70ch] break-all text-sm">{enrolment.totpURI}</p></div><div><h2 className="font-medium">Save these one-time recovery codes</h2><p className="muted mt-2 text-sm">They will not be shown again after setup.</p><ul className="mt-3 grid max-w-xl grid-cols-2 gap-2 font-mono text-sm">{enrolment.backupCodes.map((code) => <li key={code} className="rounded bg-[var(--surface)] p-2">{code}</li>)}</ul></div><form action={verify} className="max-w-xs"><label htmlFor="totp-code" className="text-sm font-medium">Six-digit code</label><input id="totp-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required className="field mt-2" /><button className="button button-primary mt-4" disabled={pending}>{pending ? "Verifying…" : "Verify and enable"}</button></form></div>}
      {error ? <p role="alert" className="mt-4 rounded-md bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
