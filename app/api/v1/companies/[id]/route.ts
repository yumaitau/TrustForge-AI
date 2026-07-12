import { NextResponse } from "next/server";
import { getCompany } from "@/lib/registry/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const company = await getCompany((await params).id);
  if (!company) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Company not found." } }, { status: 404 });
  return NextResponse.json({ data: company });
}
