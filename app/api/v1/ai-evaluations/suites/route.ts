import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
import { createEvaluationSuite } from "@/lib/security/evaluations";

export async function POST(request: Request) { try { const { session, organisation } = await requireOrganisationAction(ACTIONS.securityManage); return NextResponse.json({ data: await createEvaluationSuite(await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 }); } catch (error) { return apiError(error); } }
