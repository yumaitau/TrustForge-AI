import { NextRequest, NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { createMcpServer, listMcpServers } from "@/lib/ecosystem/repository";
import { mcpServerInputSchema } from "@/lib/ecosystem/schemas";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams; const transport = params.get("transport");
  const items = await listMcpServers({ query: params.get("q") ?? undefined, transport: transport === "stdio" || transport === "http" || transport === "websocket" ? transport : undefined, enterpriseReady: params.has("enterpriseReady") ? params.get("enterpriseReady") === "true" : undefined, sandboxCompatible: params.has("sandboxCompatible") ? params.get("sandboxCompatible") === "true" : undefined, limit: Number(params.get("limit") ?? 50) });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try { await requireOrganisationAction(ACTIONS.registryCreate); return NextResponse.json({ data: await createMcpServer(mcpServerInputSchema.parse(await request.json())) }, { status: 201 }); }
  catch (error) { return apiError(error); }
}
