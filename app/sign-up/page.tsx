import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <main className="shell grid min-h-screen place-items-center py-16">
      <section className="w-full max-w-md" aria-labelledby="sign-up-heading">
        <Link href="/" className="muted text-sm">← TrustForge AI</Link>
        <p className="eyebrow mt-12">Join the registry</p>
        <h1 id="sign-up-heading" className="mt-3 text-4xl font-semibold tracking-[-.045em]">Create account</h1>
        <p className="muted mt-3 leading-7">Start an organisation workspace to research and manage AI trust decisions.</p>
        <SignUpForm />
        <p className="muted mt-6 text-center text-sm">Already registered? <Link className="text-[var(--text)] underline underline-offset-4" href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  );
}
