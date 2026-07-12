import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { revokeVendorClaim } from "@/lib/verification/claims";
import { apiError } from "@/lib/http/responses";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { organisation } = await requireOrganisationAction(ACTIONS.organisationManage); return NextResponse.json({ data: await revokeVendorClaim((await params).id, organisation.id) }); }
  catch (error) { return apiError(error); }
}
