import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
import { importSbom } from "@/lib/security/intelligence";

export async function POST(request: Request) { try { const { session, organisation } = await requireOrganisationAction(ACTIONS.securityManage); return NextResponse.json({ data: await importSbom(await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 }); } catch (error) { return apiError(error); } }
