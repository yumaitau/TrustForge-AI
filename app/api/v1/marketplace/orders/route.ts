import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { createOrder } from "@/lib/marketplace/service";

export async function POST(request: Request) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.marketplaceSell);
    return NextResponse.json({ data: await createOrder(await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
