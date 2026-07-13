import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiError } from "./responses";
import { AuthenticationRequiredError } from "@/lib/auth/session";
import { PermissionDeniedError } from "@/lib/rbac/require";
import { ACTIONS } from "@/lib/rbac/matrix";

async function body(response: Response) {
  return response.json() as Promise<{ error: { code: string; message: string; details?: unknown } }>;
}

describe("apiError", () => {
  it("maps a ZodError to 400 INVALID_REQUEST with issue details", async () => {
    const parsed = z.object({ id: z.uuid() }).safeParse({ id: "nope" });
    const response = apiError(parsed.success ? null : parsed.error);
    expect(response.status).toBe(400);
    const payload = await body(response);
    expect(payload.error.code).toBe("INVALID_REQUEST");
    expect(Array.isArray(payload.error.details)).toBe(true);
  });

  it("maps authentication and permission errors to 401 and 403", async () => {
    const auth = apiError(new AuthenticationRequiredError());
    expect(auth.status).toBe(401);
    expect((await body(auth)).error.code).toBe("AUTHENTICATION_REQUIRED");

    const denied = apiError(new PermissionDeniedError(ACTIONS.registryCreate));
    expect(denied.status).toBe(403);
    expect((await body(denied)).error.code).toBe("PERMISSION_DENIED");
  });

  it("falls back to 500 INTERNAL_ERROR without leaking the message", async () => {
    const response = apiError(new Error("secret database dsn leaked"));
    expect(response.status).toBe(500);
    const payload = await body(response);
    expect(payload.error.code).toBe("INTERNAL_ERROR");
    expect(payload.error.message).not.toContain("secret database dsn");
  });
});
