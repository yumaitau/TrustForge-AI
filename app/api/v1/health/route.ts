import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "trustforge-api", timestamp: new Date().toISOString() });
}
