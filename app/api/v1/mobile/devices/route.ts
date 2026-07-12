import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/responses";
import { registerDevice } from "@/lib/mobile/service";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    return NextResponse.json({ data: await registerDevice(await request.json(), session.user.id) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
