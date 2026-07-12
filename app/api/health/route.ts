import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "trustforge-web", timestamp: new Date().toISOString() });
}
