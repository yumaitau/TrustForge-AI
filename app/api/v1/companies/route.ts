import { NextRequest, NextResponse } from "next/server";
import { companyInputSchema } from "@/lib/registry/schemas";
import { createCompany, listCompanies } from "@/lib/registry/repository";
import { requireSession } from "@/lib/auth/session";
import { resolveActiveOrganisation } from "@/lib/auth/active-organisation";
import { ACTIONS } from "@/lib/rbac/matrix";
import { requirePermission } from "@/lib/rbac/require";
import { apiError } from "@/lib/http/responses";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await listCompanies({ query: params.get("q") ?? undefined, cursor: params.get("cursor") ?? undefined, limit: Number(params.get("limit") ?? 20) });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const organisation = await resolveActiveOrganisation(session.user.id);
    if (!organisation) return NextResponse.json({ error: { code: "ORGANISATION_REQUIRED", message: "Create an organisation first." } }, { status: 409 });
    await requirePermission(ACTIONS.registryCreate, { userId: session.user.id, organisationId: organisation.id });
    const company = await createCompany(companyInputSchema.parse(await request.json()), organisation.id);
    return NextResponse.json({ data: company }, { status: 201 });
  } catch (error) { return apiError(error); }
}
