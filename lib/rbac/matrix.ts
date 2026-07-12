export type MemberRole = "owner" | "admin" | "analyst" | "viewer";

export const ACTIONS = {
  organisationManage: "organisation:manage",
  memberInvite: "member:invite",
  registryCreate: "registry:create",
  registryUpdate: "registry:update",
  evidenceSubmit: "evidence:submit",
  evidenceAdjudicate: "evidence:adjudicate",
  moderationManage: "moderation:manage",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export const PERMISSIONS: Readonly<Record<Action, readonly MemberRole[]>> = {
  [ACTIONS.organisationManage]: ["owner"],
  [ACTIONS.memberInvite]: ["owner", "admin"],
  [ACTIONS.registryCreate]: ["owner", "admin", "analyst"],
  [ACTIONS.registryUpdate]: ["owner", "admin", "analyst"],
  [ACTIONS.evidenceSubmit]: ["owner", "admin", "analyst"],
  [ACTIONS.evidenceAdjudicate]: ["owner", "admin"],
  [ACTIONS.moderationManage]: ["owner", "admin"],
};

export function isPermitted(action: Action, role: MemberRole) {
  return PERMISSIONS[action].includes(role);
}

export function assertPermissionMatrix() {
  if (isPermitted(ACTIONS.organisationManage, "viewer")) {
    throw new Error("Viewer must never manage an organisation");
  }
  if (isPermitted(ACTIONS.evidenceAdjudicate, "analyst")) {
    throw new Error("Evidence submitters must not adjudicate evidence by default");
  }
}
