import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { challengeEvidence } from "@/lib/evidence/service";
import { apiError } from "@/lib/http/responses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const input = z.object({ reason: z.string().trim().min(20).max(2_000), supportingEvidenceIds: z.array(z.uuid()).max(20).optional() }).parse(await request.json());
    return NextResponse.json({ data: await challengeEvidence({ evidenceId: (await params).id, userId: session.user.id, ...input }) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
