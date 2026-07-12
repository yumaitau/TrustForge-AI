import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { addMcpDependency, listMcpDependencies } from "@/lib/ecosystem/repository";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { return NextResponse.json({ items: await listMcpDependencies((await params).id) }); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireOrganisationAction(ACTIONS.registryUpdate); const input = z.object({ ecosystem: z.string().min(1).max(80), packageName: z.string().min(1).max(240), versionRange: z.string().max(120).optional(), direct: z.boolean().default(true) }).parse(await request.json()); return NextResponse.json({ data: await addMcpDependency({ mcpServerId: (await params).id, ...input }) }, { status: 201 }); } catch (error) { return apiError(error); } }
