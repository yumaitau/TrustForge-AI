import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/responses";
import { addFavorite, listFavorites } from "@/lib/mobile/service";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({ data: await listFavorites(session.user.id) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    return NextResponse.json({ data: await addFavorite(await request.json(), session.user.id) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
