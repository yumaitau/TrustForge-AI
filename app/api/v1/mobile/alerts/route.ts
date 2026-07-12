import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/responses";
import { acknowledgeAlerts, pendingAlerts } from "@/lib/mobile/service";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 100);
    return NextResponse.json({ data: await pendingAlerts(session.user.id, Number.isFinite(limit) ? limit : 100) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = z.object({ acknowledgeIds: z.array(z.uuid()).min(1).max(200) }).parse(await request.json());
    return NextResponse.json({ data: await acknowledgeAlerts(body.acknowledgeIds, session.user.id) });
  } catch (error) {
    return apiError(error);
  }
}
