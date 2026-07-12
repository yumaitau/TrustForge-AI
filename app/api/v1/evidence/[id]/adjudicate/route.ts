import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { adjudicateEvidence } from "@/lib/evidence/service";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.evidenceAdjudicate);
    const input = z.object({ status: z.enum(["verified", "rejected"]) }).parse(await request.json());
    return NextResponse.json({ data: await adjudicateEvidence({ evidenceId: (await params).id, status: input.status, actorUserId: session.user.id, organisationId: organisation.id }) });
  } catch (error) { return apiError(error); }
}
