import { NextRequest, NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { createModel, listEcosystemProfiles } from "@/lib/ecosystem/repository";
import { modelInputSchema } from "@/lib/ecosystem/schemas";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
export async function GET(request: NextRequest) { return NextResponse.json({ items: await listEcosystemProfiles("model", request.nextUrl.searchParams.get("q") ?? undefined) }); }
export async function POST(request: Request) { try { await requireOrganisationAction(ACTIONS.registryCreate); return NextResponse.json({ data: await createModel(modelInputSchema.parse(await request.json())) }, { status: 201 }); } catch (error) { return apiError(error); } }
