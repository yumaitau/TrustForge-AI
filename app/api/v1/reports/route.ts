import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { reportContent } from "@/lib/community/service";
import { apiError } from "@/lib/http/responses";

export async function POST(request: Request) {
  try { const session = await requireSession(); const input = z.object({ targetType: z.string().min(2).max(50), targetId: z.uuid(), reason: z.string().min(3).max(120), details: z.string().max(2_000).optional() }).parse(await request.json()); return NextResponse.json({ data: await reportContent({ ...input, reporterUserId: session.user.id }) }, { status: 201 }); }
  catch (error) { return apiError(error); }
}
