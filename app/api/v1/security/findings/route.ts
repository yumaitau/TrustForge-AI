import { NextRequest, NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
import { listFindings, upsertFinding } from "@/lib/security/intelligence";

export async function GET(request: NextRequest) { const subjectType = request.nextUrl.searchParams.get("subjectType"); const subjectId = request.nextUrl.searchParams.get("subjectId"); if (!subjectType || !subjectId) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "subjectType and subjectId are required." } }, { status: 400 }); return NextResponse.json({ items: await listFindings(subjectType, subjectId) }); }
export async function POST(request: Request) { try { const { session, organisation } = await requireOrganisationAction(ACTIONS.securityManage); return NextResponse.json({ data: await upsertFinding(await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 }); } catch (error) { return apiError(error); } }
