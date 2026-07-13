"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(data.get("email")),
      password: String(data.get("password")),
      rememberMe: data.get("remember") === "on",
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Unable to sign in. Check your details and try again.");
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="mt-9 space-y-5 border-y border-[var(--line)] py-8" onSubmit={submit} noValidate>
      <div><label htmlFor="email" className="text-sm font-medium">Work email</label><input required id="email" name="email" type="email" autoComplete="email" className="field mt-2" aria-invalid={error ? true : undefined} aria-describedby={error ? "form-error" : undefined} /></div>
      <div><label htmlFor="password" className="text-sm font-medium">Password</label><input required minLength={14} id="password" name="password" type="password" autoComplete="current-password" className="field mt-2" aria-invalid={error ? true : undefined} aria-describedby={error ? "form-error" : undefined} /></div>
      <label className="muted flex items-center gap-2 text-sm"><input name="remember" type="checkbox" className="size-4 accent-[var(--accent)]" /> Keep me signed in on this device</label>
      {error ? <p ref={errorRef} id="form-error" tabIndex={-1} role="alert" className="rounded-md bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)] outline-none">{error}</p> : null}
      <button className="button button-primary w-full" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <button className="button button-secondary w-full" type="button" disabled={pending} onClick={async () => {
        setPending(true); setError(null);
        const result = await authClient.signIn.passkey({ autoFill: false });
        setPending(false);
        if (result?.error) setError(result.error.message ?? "Passkey sign-in was not completed.");
        else { router.push("/dashboard"); router.refresh(); }
      }}>Use a passkey</button>
    </form>
  );
}
