import { NextRequest, NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { createSkill, listEcosystemProfiles } from "@/lib/ecosystem/repository";
import { skillInputSchema } from "@/lib/ecosystem/schemas";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
export async function GET(request: NextRequest) { const p = request.nextUrl.searchParams; return NextResponse.json(await listEcosystemProfiles("skill", { query: p.get("q") ?? undefined, cursor: p.get("cursor") ?? undefined, limit: p.get("limit") ? Number(p.get("limit")) : undefined })); }
export async function POST(request: Request) { try { await requireOrganisationAction(ACTIONS.registryCreate); return NextResponse.json({ data: await createSkill(skillInputSchema.parse(await request.json())) }, { status: 201 }); } catch (error) { return apiError(error); } }
