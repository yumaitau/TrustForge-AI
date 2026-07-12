import { resolveActiveOrganisation } from "./active-organisation";
import { requireSession } from "./session";
import { type Action } from "@/lib/rbac/matrix";
import { requirePermission } from "@/lib/rbac/require";

export async function requireOrganisationAction(action: Action) {
  const session = await requireSession();
  const organisation = await resolveActiveOrganisation(session.user.id);
  if (!organisation) throw new Error("Active organisation required");
  const role = await requirePermission(action, { userId: session.user.id, organisationId: organisation.id });
  return { session, organisation, role };
}
