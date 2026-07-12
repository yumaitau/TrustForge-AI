import { NextRequest, NextResponse } from "next/server";
import { productInputSchema, productTypes } from "@/lib/registry/schemas";
import { createProduct, listProducts } from "@/lib/registry/repository";
import { requireSession } from "@/lib/auth/session";
import { resolveActiveOrganisation } from "@/lib/auth/active-organisation";
import { ACTIONS } from "@/lib/rbac/matrix";
import { requirePermission } from "@/lib/rbac/require";
import { apiError } from "@/lib/http/responses";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const result = await listProducts({ query: params.get("q") ?? undefined, cursor: params.get("cursor") ?? undefined, limit: Number(params.get("limit") ?? 20), type: productTypes.find((item) => item === type) });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const organisation = await resolveActiveOrganisation(session.user.id);
    if (!organisation) return NextResponse.json({ error: { code: "ORGANISATION_REQUIRED", message: "Create an organisation first." } }, { status: 409 });
    await requirePermission(ACTIONS.registryCreate, { userId: session.user.id, organisationId: organisation.id });
    return NextResponse.json({ data: await createProduct(productInputSchema.parse(await request.json())) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
