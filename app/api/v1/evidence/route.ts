import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { evidence } from "@/db/schema";
import { db } from "@/lib/db/client";
import { submitEvidence, evidenceInputSchema } from "@/lib/evidence/service";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";

export async function GET(request: NextRequest) {
  const subjectType = request.nextUrl.searchParams.get("subjectType");
  const subjectId = request.nextUrl.searchParams.get("subjectId");
  if (!subjectType || !subjectId) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "subjectType and subjectId are required." } }, { status: 400 });
  const items = await db.select().from(evidence).where(and(eq(evidence.subjectType, subjectType as typeof evidence.subjectType.enumValues[number]), eq(evidence.subjectId, subjectId))).orderBy(desc(evidence.observedAt)).limit(100);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.evidenceSubmit);
    const item = await submitEvidence(evidenceInputSchema.parse(await request.json()), { userId: session.user.id, organisationId: organisation.id });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) { return apiError(error); }
}
