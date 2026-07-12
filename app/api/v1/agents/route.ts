import { NextRequest, NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { createAgent, listEcosystemProfiles } from "@/lib/ecosystem/repository";
import { agentInputSchema } from "@/lib/ecosystem/schemas";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
export async function GET(request: NextRequest) { return NextResponse.json({ items: await listEcosystemProfiles("agent", request.nextUrl.searchParams.get("q") ?? undefined) }); }
export async function POST(request: Request) { try { await requireOrganisationAction(ACTIONS.registryCreate); return NextResponse.json({ data: await createAgent(agentInputSchema.parse(await request.json())) }, { status: 201 }); } catch (error) { return apiError(error); } }
