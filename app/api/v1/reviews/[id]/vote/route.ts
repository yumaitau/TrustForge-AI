import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { voteOnReview } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const session = await requireSession(); const { helpful } = z.object({ helpful: z.boolean() }).parse(await request.json()); return NextResponse.json({ data: await voteOnReview({ reviewId: (await params).id, userId: session.user.id, helpful }) }); }
  catch (error) { return apiError(error); }
}
