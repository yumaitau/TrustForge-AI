import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { adjudicateSuggestedEdit } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { session } = await requireOrganisationAction(ACTIONS.moderationManage); const { status } = z.object({ status: z.enum(["published", "rejected"]) }).parse(await request.json()); return NextResponse.json({ data: await adjudicateSuggestedEdit({ editId: (await params).id, reviewerUserId: session.user.id, status }) }); }
  catch (error) { return apiError(error); }
}
