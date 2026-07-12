import { NextResponse } from "next/server";
import { requireOrganisationAction } from "@/lib/auth/context";
import { apiError } from "@/lib/http/responses";
import { queueDueMonitoringRuns } from "@/lib/monitoring/service";
import { ACTIONS } from "@/lib/rbac/matrix";

export async function POST() { try { await requireOrganisationAction(ACTIONS.monitoringManage); return NextResponse.json({ data: { runIds: await queueDueMonitoringRuns() } }, { status: 202 }); } catch (error) { return apiError(error); } }
