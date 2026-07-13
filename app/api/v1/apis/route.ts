import { NextRequest, NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { createApiOffering, listEcosystemProfiles } from "@/lib/ecosystem/repository";
import { apiOfferingInputSchema } from "@/lib/ecosystem/schemas";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
export async function GET(request: NextRequest) { const p = request.nextUrl.searchParams; return NextResponse.json(await listEcosystemProfiles("api", { query: p.get("q") ?? undefined, cursor: p.get("cursor") ?? undefined, limit: p.get("limit") ? Number(p.get("limit")) : undefined })); }
export async function POST(request: Request) { try { await requireOrganisationAction(ACTIONS.registryCreate); return NextResponse.json({ data: await createApiOffering(apiOfferingInputSchema.parse(await request.json())) }, { status: 201 }); } catch (error) { return apiError(error); } }
