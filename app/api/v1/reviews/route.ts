import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { reviews } from "@/db/schema";
import { db } from "@/lib/db/client";
import { submitReview } from "@/lib/community/service";
import { requireSession } from "@/lib/auth/session";
import { apiError } from "@/lib/http/responses";

export async function GET(request: NextRequest) {
  const subjectType = request.nextUrl.searchParams.get("subjectType"); const subjectId = request.nextUrl.searchParams.get("subjectId");
  if (!subjectType || !subjectId) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "subjectType and subjectId are required." } }, { status: 400 });
  const items = await db.select().from(reviews).where(and(eq(reviews.subjectType, subjectType as typeof reviews.subjectType.enumValues[number]), eq(reviews.subjectId, subjectId), eq(reviews.status, "published"), isNull(reviews.deletedAt))).orderBy(desc(reviews.publishedAt)).limit(100);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try { const session = await requireSession(); return NextResponse.json({ data: await submitReview(await request.json(), session.user.id) }, { status: 201 }); }
  catch (error) { return apiError(error); }
}
