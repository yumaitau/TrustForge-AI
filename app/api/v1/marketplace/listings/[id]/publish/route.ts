import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganisationAction } from "@/lib/auth/context";
import { ACTIONS } from "@/lib/rbac/matrix";
import { apiError } from "@/lib/http/responses";
import { publishListing } from "@/lib/marketplace/service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, organisation } = await requireOrganisationAction(ACTIONS.marketplaceSell);
    const id = z.uuid().parse((await params).id);
    return NextResponse.json({ data: await publishListing(id, { userId: session.user.id, organisationId: organisation.id }) });
  } catch (error) {
    return apiError(error);
  }
}
