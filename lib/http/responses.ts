import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationRequiredError } from "@/lib/auth/session";
import { PermissionDeniedError } from "@/lib/rbac/require";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "The request is invalid.", details: error.issues } }, { status: 400 });
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: error.message } }, { status: 401 });
  if (error instanceof PermissionDeniedError) return NextResponse.json({ error: { code: "PERMISSION_DENIED", message: error.message } }, { status: 403 });
  console.error(error);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
}
