import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/responses";
import { listAlertPreferences, upsertAlertPreference } from "@/lib/mobile/service";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({ data: await listAlertPreferences(session.user.id) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    return NextResponse.json({ data: await upsertAlertPreference(await request.json(), session.user.id) });
  } catch (error) {
    return apiError(error);
  }
}
