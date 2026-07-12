import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
import { calculateAndPersistTrustScore } from "@/lib/trust/service";

export async function POST(_request: Request, { params }: { params: Promise<{ subjectType: string; subjectId: string }> }) {
  try {
    await requireOrganisationAction(ACTIONS.evidenceAdjudicate);
    const raw = await params; const input = z.object({ subjectType: z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]), subjectId: z.uuid() }).parse(raw);
    return NextResponse.json({ data: await calculateAndPersistTrustScore(input.subjectType, input.subjectId) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
