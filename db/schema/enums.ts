import { pgEnum } from "drizzle-orm/pg-core";

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "analyst", "viewer"]);
export const subjectTypeEnum = pgEnum("subject_type", [
  "company", "product", "mcp_server", "skill", "agent", "model", "api",
]);
export const productTypeEnum = pgEnum("product_type", [
  "application", "mcp_server", "skill", "agent", "model", "api", "developer_tool",
]);
export const verificationLevelEnum = pgEnum("verification_level", [
  "unverified", "community_verified", "identity_verified", "organisation_verified",
  "security_verified", "enterprise_verified", "government_ready", "independently_audited",
]);
export const evidenceStatusEnum = pgEnum("evidence_status", [
  "pending", "verified", "rejected", "expired", "superseded",
]);
export const evidenceSourceEnum = pgEnum("evidence_source", [
  "first_party", "registry", "repository", "automated_scan", "community", "independent_audit",
]);
export const trustDimensionEnum = pgEnum("trust_dimension", [
  "security", "privacy", "transparency", "documentation", "maintenance", "support",
  "responsible_ai", "community", "popularity", "incident_history", "update_cadence",
  "open_source_health", "dependency_risk", "vulnerability_history",
]);
