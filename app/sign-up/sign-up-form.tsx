"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(null);
    const data = new FormData(event.currentTarget);
    const result = await authClient.signUp.email({ name: String(data.get("name")), email: String(data.get("email")), password: String(data.get("password")) });
    setPending(false);
    if (result.error) { setError(result.error.message ?? "Unable to create your account."); return; }
    router.push("/onboarding"); router.refresh();
  }

  return (
    <form className="mt-9 space-y-5 border-y border-[var(--line)] py-8" onSubmit={submit} noValidate>
      <div><label htmlFor="name" className="text-sm font-medium">Full name</label><input required id="name" name="name" autoComplete="name" className="field mt-2" aria-invalid={error ? true : undefined} aria-describedby={error ? "form-error" : undefined} /></div>
      <div><label htmlFor="email" className="text-sm font-medium">Work email</label><input required id="email" name="email" type="email" autoComplete="email" className="field mt-2" aria-invalid={error ? true : undefined} aria-describedby={error ? "form-error" : undefined} /></div>
      <div><label htmlFor="password" className="text-sm font-medium">Password</label><input required minLength={14} id="password" name="password" type="password" autoComplete="new-password" className="field mt-2" aria-invalid={error ? true : undefined} aria-describedby={error ? "password-help form-error" : "password-help"} /><p id="password-help" className="muted mt-2 text-xs">At least 14 characters. Passkeys can be added after onboarding.</p></div>
      {error ? <p ref={errorRef} id="form-error" tabIndex={-1} role="alert" className="rounded-md bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)] outline-none">{error}</p> : null}
      <button className="button button-primary w-full" type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
    </form>
  );
}
