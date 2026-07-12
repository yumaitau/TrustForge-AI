import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { appealReview } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await requireSession(); const { reason } = z.object({ reason: z.string().min(20).max(2_000) }).parse(await request.json()); return NextResponse.json({ data: await appealReview({ reviewId: (await params).id, userId: session.user.id, reason }) }, { status: 201 }); }
  catch (error) { return apiError(error); }
}
