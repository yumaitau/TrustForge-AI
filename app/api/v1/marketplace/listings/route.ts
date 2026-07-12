import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { createListing, publishedListings } from "@/lib/marketplace/service";

export async function GET(request: Request) {
  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    return NextResponse.json({ data: await publishedListings(Number.isFinite(limit) ? limit : 50) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.marketplaceSell);
    return NextResponse.json({ data: await createListing(await request.json(), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
