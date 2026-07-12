import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { recordReview } from "@/lib/research/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.researchManage);
    const id = z.uuid().parse((await params).id);
    return NextResponse.json({ data: await recordReview(id, await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
