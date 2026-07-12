import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { addMcpRelease, listMcpReleases } from "@/lib/ecosystem/repository";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { return NextResponse.json({ items: await listMcpReleases((await params).id) }); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireOrganisationAction(ACTIONS.registryUpdate); const input = z.object({ version: z.string().min(1).max(100), releaseUrl: z.url().optional(), commitSha: z.string().max(100).optional(), signatureVerified: z.boolean().default(false), sbomUrl: z.url().optional(), publishedAt: z.coerce.date() }).parse(await request.json()); return NextResponse.json({ data: await addMcpRelease({ mcpServerId: (await params).id, ...input }) }, { status: 201 }); } catch (error) { return apiError(error); } }
