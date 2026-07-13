import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { createVendorClaim } from "@/lib/verification/claims";

export async function POST(request: Request) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.registryUpdate);
    const input = z.object({ subjectType: z.enum(["company", "product"]), subjectId: z.uuid(), method: z.enum(["dns", "email", "github", "oauth", "signed_challenge"]), target: z.string().max(300).optional(), provider: z.string().max(80).optional(), publicKey: z.string().max(4_000).optional() })
      .refine((value) => value.method !== "email" || Boolean(value.target), { message: "An email address at the claimed domain is required for email verification.", path: ["target"] })
      .parse(await request.json());
    const result = await createVendorClaim({ ...input, organisationId: organisation.id, userId: session.user.id });
    if (input.method === "email" && process.env.NODE_ENV !== "production") console.info(`[TrustForge development email code] ${input.target}: ${result.code}`);
    const publishableChallenge = input.method === "dns" || input.method === "signed_challenge" ? result.challenge : undefined;
    return NextResponse.json({ data: { claim: result.claim, challenge: publishableChallenge, warning: publishableChallenge ? "The challenge is returned once and must be published or signed through the selected verification channel." : "The challenge is delivered through the selected identity provider." } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
