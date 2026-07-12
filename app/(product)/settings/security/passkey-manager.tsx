"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function PasskeyManager() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-[var(--line)] py-6"><button className="button button-secondary" type="button" disabled={pending} onClick={async () => { setPending(true); setMessage(null); const result = await authClient.passkey.addPasskey({ name: "TrustForge passkey" }); setPending(false); setMessage(result?.error ? result.error.message ?? "Passkey registration was not completed." : "Passkey added successfully."); }}>{pending ? "Waiting for device…" : "Add a passkey"}</button>{message ? <p aria-live="polite" className="muted text-sm">{message}</p> : null}</div>;
}
