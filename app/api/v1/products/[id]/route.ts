import { NextResponse } from "next/server";
import { getProduct } from "@/lib/registry/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const product = await getProduct((await params).id);
  if (!product) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Product not found." } }, { status: 404 });
  return NextResponse.json({ data: product });
}
