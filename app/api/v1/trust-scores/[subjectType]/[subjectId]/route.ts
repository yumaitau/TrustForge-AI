import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreHistory } from "@/lib/trust/service";

const subjectTypeSchema = z.enum(["company", "product", "mcp_server", "skill", "agent", "model", "api"]);

export async function GET(_request: Request, { params }: { params: Promise<{ subjectType: string; subjectId: string }> }) {
  const input = await params; const subjectType = subjectTypeSchema.safeParse(input.subjectType); const subjectId = z.uuid().safeParse(input.subjectId);
  if (!subjectType.success || !subjectId.success) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "Invalid trust score subject." } }, { status: 400 });
  const history = await scoreHistory(subjectType.data, subjectId.data);
  return NextResponse.json({ data: history[0] ?? null, history });
}
