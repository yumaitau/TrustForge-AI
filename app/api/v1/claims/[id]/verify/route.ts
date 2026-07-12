import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { verifyVendorClaim } from "@/lib/verification/claims";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOrganisationAction(ACTIONS.registryUpdate);
    const proof = z.object({ challenge: z.string().min(20).max(200), code: z.string().optional(), signature: z.string().max(2_000).optional(), providerAttestation: z.string().max(500).optional() }).parse(await request.json());
    return NextResponse.json({ data: await verifyVendorClaim((await params).id, proof) });
  } catch (error) { return apiError(error); }
}
