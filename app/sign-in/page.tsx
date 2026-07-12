import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="shell grid min-h-screen place-items-center py-16">
      <section className="w-full max-w-md">
        <Link href="/" className="muted text-sm">← TrustForge AI</Link>
        <p className="eyebrow mt-12">Secure access</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.045em]">Sign in</h1>
        <p className="muted mt-3 leading-7">Authentication wiring is established. The complete passkey and MFA flow is tracked in the Phase 1 roadmap.</p>
        <div className="mt-9 border-y border-[var(--line)] py-8">
          <label htmlFor="email" className="text-sm font-medium">Work email</label>
          <input id="email" type="email" autoComplete="email" className="mt-2 min-h-12 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 outline-none focus:border-[var(--accent)]" placeholder="you@company.com" />
          <button className="button button-primary mt-4 w-full" type="button" disabled aria-describedby="auth-status">Continue</button>
          <p id="auth-status" className="muted mt-3 text-sm">Sign-in actions will be enabled with the authentication delivery issue.</p>
        </div>
      </section>
    </main>
  );
}
