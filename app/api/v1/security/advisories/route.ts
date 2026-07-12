import { NextResponse } from "next/server";
import { securityAdvisories } from "@/db/schema";
import { requireOrganisationAction } from "@/lib/auth/context";
import { db } from "@/lib/db/client";
import { apiError } from "@/lib/http/responses";
import { ACTIONS } from "@/lib/rbac/matrix";
import { advisoryInputSchema } from "@/lib/security/schemas";
import { upsertAdvisory } from "@/lib/security/intelligence";

export async function GET() { return NextResponse.json({ items: await db.select().from(securityAdvisories).orderBy(securityAdvisories.modifiedAt).limit(200) }); }
export async function POST(request: Request) { try { const { session, organisation } = await requireOrganisationAction(ACTIONS.securityManage); return NextResponse.json({ data: await upsertAdvisory(advisoryInputSchema.parse(await request.json()), { userId: session.user.id, organisationId: organisation.id }) }, { status: 201 }); } catch (error) { return apiError(error); } }
