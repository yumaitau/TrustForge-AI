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

export const claimMethodEnum = pgEnum("claim_method", ["dns", "email", "github", "oauth", "signed_challenge"]);
export const claimStatusEnum = pgEnum("claim_status", ["pending", "verified", "failed", "expired", "revoked"]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "published", "rejected", "removed", "appealed"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["open", "investigating", "actioned", "dismissed", "appealed", "resolved"]);
export const reputationEventEnum = pgEnum("reputation_event", ["review_published", "review_helpful", "edit_accepted", "evidence_verified", "security_research", "moderation_upheld", "penalty"]);
export const fraudSignalEnum = pgEnum("fraud_signal", ["duplicate_content", "review_burst", "coordinated_vote", "account_cluster", "velocity", "identity_mismatch"]);
export const securitySeverityEnum = pgEnum("security_severity", ["unknown", "none", "low", "medium", "high", "critical"]);
export const findingStatusEnum = pgEnum("finding_status", ["open", "accepted_risk", "false_positive", "resolved", "not_affected"]);
export const monitoringTargetTypeEnum = pgEnum("monitoring_target_type", ["release", "repository", "vulnerability", "ownership", "domain", "certificate", "incident", "disclosure"]);
export const monitoringRunStatusEnum = pgEnum("monitoring_run_status", ["queued", "running", "succeeded", "failed", "dead_lettered"]);
export const aiEvaluationKindEnum = pgEnum("ai_evaluation_kind", ["prompt_injection", "data_retention", "training_usage", "jailbreak_resilience", "permission_model", "tool_safety", "responsible_ai"]);
export const aiEvaluationOutcomeEnum = pgEnum("ai_evaluation_outcome", ["pass", "fail", "inconclusive", "not_applicable"]);
export const procurementStatusEnum = pgEnum("procurement_status", ["draft", "submitted", "assessing", "approved", "rejected", "cancelled", "expired"]);
export const decisionTypeEnum = pgEnum("decision_type", ["approve", "reject", "request_changes", "grant_exception"]);
export const classificationEnum = pgEnum("classification", ["public", "internal", "confidential", "restricted"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["draft", "in_progress", "review_required", "complete"]);
export const sellerStatusEnum = pgEnum("seller_status", ["pending", "verified", "suspended", "revoked"]);
export const listingStatusEnum = pgEnum("listing_status", ["draft", "published", "suspended", "delisted"]);
export const commercialRelationshipEnum = pgEnum("commercial_relationship", ["seller", "reseller", "affiliate", "sponsor", "partner"]);
export const pricingModelEnum = pgEnum("pricing_model", ["free", "one_time", "subscription", "usage_based"]);
export const disputeKindEnum = pgEnum("dispute_kind", ["billing", "misrepresentation", "quality", "tax", "other"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["open", "under_review", "resolved", "rejected"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "refunded", "cancelled"]);
export const mobilePlatformEnum = pgEnum("mobile_platform", ["ios", "android"]);
export const alertKindEnum = pgEnum("alert_kind", ["score_drop", "new_finding", "verification_change"]);
export const alertStatusEnum = pgEnum("alert_status", ["queued", "sent", "failed"]);
