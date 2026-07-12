import { NextResponse } from "next/server";
import { apiError } from "@/lib/http/responses";
import { recommendForQuestion } from "@/lib/recommendation/service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "A JSON body is required." } }, { status: 400 });
    return NextResponse.json({ data: await recommendForQuestion(body) });
  } catch (error) {
    return apiError(error);
  }
}
