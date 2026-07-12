import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = (await searchParams).next;
  return (
    <main className="shell grid min-h-screen place-items-center py-16">
      <section className="w-full max-w-md" aria-labelledby="sign-in-heading">
        <Link href="/" className="muted text-sm">← TrustForge AI</Link>
        <p className="eyebrow mt-12">Secure access</p>
        <h1 id="sign-in-heading" className="mt-3 text-4xl font-semibold tracking-[-.045em]">Sign in</h1>
        <p className="muted mt-3 leading-7">Continue to your organisation&apos;s trust registry and evidence workspace.</p>
        <SignInForm nextPath={nextPath?.startsWith("/") ? nextPath : "/dashboard"} />
        <p className="muted mt-6 text-center text-sm">New to TrustForge? <Link className="text-[var(--text)] underline underline-offset-4" href="/sign-up">Create an account</Link></p>
      </section>
    </main>
  );
}
