import { and, asc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { organisationMembers, organisations } from "@/db/schema";

export const ACTIVE_ORGANISATION_COOKIE = "trustforge_active_organisation";

export async function resolveActiveOrganisation(userId: string) {
  const cookieStore = await cookies();
  const hintedId = cookieStore.get(ACTIVE_ORGANISATION_COOKIE)?.value;

  const memberships = await db
    .select({ id: organisations.id, slug: organisations.slug, name: organisations.name, role: organisationMembers.role })
    .from(organisationMembers)
    .innerJoin(organisations, eq(organisations.id, organisationMembers.organisationId))
    .where(and(eq(organisationMembers.userId, userId), isNull(organisationMembers.deletedAt), isNull(organisations.deletedAt)))
    .orderBy(asc(organisationMembers.joinedAt));

  if (memberships.length === 0) return null;
  return memberships.find((membership) => membership.id === hintedId) ?? memberships[0];
}
