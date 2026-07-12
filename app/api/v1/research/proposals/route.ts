import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { createProposal, listProposals } from "@/lib/research/service";
import { RESEARCH_STATUSES } from "@/lib/research/lifecycle";

export async function GET(request: Request) {
  try {
    const { organisation } = await requireOrganisationAction(ACTIONS.researchPropose);
    const raw = new URL(request.url).searchParams.get("status");
    const status = raw ? z.enum(RESEARCH_STATUSES).parse(raw) : undefined;
    return NextResponse.json({ data: await listProposals(organisation.id, status) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.researchPropose);
    return NextResponse.json({ data: await createProposal(await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
