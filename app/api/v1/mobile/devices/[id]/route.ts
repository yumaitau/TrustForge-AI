import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/responses";
import { removeDevice } from "@/lib/mobile/service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const id = z.uuid().parse((await params).id);
    return NextResponse.json({ data: await removeDevice(id, session.user.id) });
  } catch (error) {
    return apiError(error);
  }
}
