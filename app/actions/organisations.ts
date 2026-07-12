"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auditEvents, organisationMembers, organisations } from "@/db/schema";
import { ACTIVE_ORGANISATION_COOKIE } from "@/lib/auth/active-organisation";
import { requireSession } from "@/lib/auth/session";

const organisationSchema = z.object({ name: z.string().trim().min(2).max(120) });

function slugify(name: string) {
  const slug = name.normalize("NFKD").replace(/[^\x00-\x7F]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
  return `${slug || "organisation"}-${randomBytes(4).toString("hex")}`;
}

export async function createOrganisation(formData: FormData) {
  const session = await requireSession();
  const input = organisationSchema.parse({ name: formData.get("name") });
  const organisationId = uuidv7();

  await db.transaction(async (tx) => {
    await tx.insert(organisations).values({ id: organisationId, name: input.name, slug: slugify(input.name) });
    await tx.insert(organisationMembers).values({ organisationId, userId: session.user.id, role: "owner" });
    await tx.insert(auditEvents).values({
      organisationId,
      actorUserId: session.user.id,
      action: "organisation.created",
      resourceType: "organisation",
      resourceId: organisationId,
    });
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANISATION_COOKIE, organisationId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  redirect("/dashboard");
}
