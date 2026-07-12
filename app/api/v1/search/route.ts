import { NextRequest, NextResponse } from "next/server";
import { listCompanies, listProducts } from "@/lib/registry/repository";
import { productTypes } from "@/lib/registry/schemas";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ data: [], meta: { query, count: 0 } });
  const type = params.get("type");
  const verified = params.get("verified") === "true";
  const [companyResult, productResult] = await Promise.all([
    type && type !== "company" ? Promise.resolve({ items: [] }) : listCompanies({ query, countryCode: params.get("countryCode") ?? undefined, verified, limit: 25 }),
    type === "company" ? Promise.resolve({ items: [] }) : listProducts({ query, type: productTypes.find((item) => item === type), openSource: params.has("openSource") ? params.get("openSource") === "true" : undefined, verified, limit: 25 }),
  ]);
  const data = [
    ...companyResult.items.map((item) => ({ id: item.id, slug: item.slug, name: item.displayName, type: "company", verificationLevel: item.verificationLevel, description: item.description })),
    ...productResult.items.map((item) => ({ id: item.id, slug: item.slug, name: item.name, type: item.type, verificationLevel: item.verificationLevel, description: item.description })),
  ];
  return NextResponse.json({ data, meta: { query, count: data.length } });
}
