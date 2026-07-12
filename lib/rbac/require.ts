import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { organisationMembers } from "@/db/schema";
import { type Action, isPermitted } from "./matrix";

export class PermissionDeniedError extends Error {
  constructor(readonly action: Action) {
    super(`Permission denied for ${action}`);
    this.name = "PermissionDeniedError";
  }
}

export async function requirePermission(action: Action, input: { userId: string; organisationId: string }) {
  const [membership] = await db
    .select({ role: organisationMembers.role })
    .from(organisationMembers)
    .where(and(
      eq(organisationMembers.userId, input.userId),
      eq(organisationMembers.organisationId, input.organisationId),
      isNull(organisationMembers.deletedAt),
    ))
    .limit(1);

  if (!membership || !isPermitted(action, membership.role)) throw new PermissionDeniedError(action);
  return membership.role;
}
