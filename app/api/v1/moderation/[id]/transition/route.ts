import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { resolveModerationCase } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { session } = await requireOrganisationAction(ACTIONS.moderationManage); const input = z.object({ status: z.enum(["investigating", "actioned", "dismissed", "resolved"]), resolution: z.string().max(2_000).optional() }).parse(await request.json()); return NextResponse.json({ data: await resolveModerationCase({ caseId: (await params).id, moderatorUserId: session.user.id, ...input }) }); }
  catch (error) { return apiError(error); }
}
