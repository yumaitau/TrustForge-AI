import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
import { adjudicateFinding } from "@/lib/security/intelligence";
import { findingAdjudicationSchema } from "@/lib/security/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const { session, organisation } = await requireOrganisationAction(ACTIONS.securityManage); return NextResponse.json({ data: await adjudicateFinding({ findingId: id, ...findingAdjudicationSchema.parse(await request.json()), actor: { userId: session.user.id, organisationId: organisation.id } }) }); } catch (error) { return apiError(error); } }
