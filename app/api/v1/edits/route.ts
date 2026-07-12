import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { submitSuggestedEdit } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";

export async function POST(request: Request) {
  try { const session = await requireSession(); const input = z.object({ subjectType: z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]), subjectId: z.uuid(), patch: z.record(z.string(), z.unknown()), rationale: z.string().min(20).max(2_000) }).parse(await request.json()); return NextResponse.json({ data: await submitSuggestedEdit({ ...input, userId: session.user.id }) }, { status: 201 }); }
  catch (error) { return apiError(error); }
}
