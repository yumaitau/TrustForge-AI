import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { adjudicateFlaggedReview } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session } = await requireOrganisationAction(ACTIONS.moderationManage);
    const input = z.object({ decision: z.enum(["publish", "reject"]) }).parse(await request.json());
    return NextResponse.json({ data: await adjudicateFlaggedReview({ reviewId: (await params).id, moderatorUserId: session.user.id, decision: input.decision }) });
  } catch (error) { return apiError(error); }
}
