import { NextResponse } from "next/server";
import { z } from "zod";
import { executeGraphql } from "@/lib/graphql/schema";

export async function POST(request: Request) {
  const parsed = z.object({ query: z.string().min(1).max(20_000), variables: z.record(z.string(), z.unknown()).optional(), operationName: z.string().optional() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ errors: [{ message: "Invalid GraphQL request." }] }, { status: 400 });
  const result = await executeGraphql({ source: parsed.data.query, variableValues: parsed.data.variables, operationName: parsed.data.operationName });
  return NextResponse.json(result, { status: result.errors?.length ? 400 : 200 });
}
