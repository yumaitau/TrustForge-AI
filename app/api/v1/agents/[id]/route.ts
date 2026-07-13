import { NextResponse } from "next/server";
import { getEcosystemProfile } from "@/lib/ecosystem/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getEcosystemProfile("agent", (await params).id);
  if (!profile) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Agent not found." } }, { status: 404 });
  return NextResponse.json({ data: profile });
}
