# Security intelligence

Phase 4 records security intelligence as attributable evidence. An advisory is a source record; a finding is an observed relationship between a scanner, a registry subject, and a stable fingerprint. They are deliberately separate from supplier claims and from Trust Scores.

## Sources and retention

The current provider boundary has an official OSV adapter plus explicit ingestion contracts for CVE and GitHub Advisory data. Each ingestion carries the source URL, retrieval time, content hash, source licence where known, and bounded raw payload. `(source, externalId)` deduplicates advisories; `(subject, scanner, fingerprint)` deduplicates findings while preserving first and last observation times.

Approved remote sources use HTTPS only, resolve all DNS answers before connection, reject private and loopback addresses, revalidate redirects, cap redirects at three, and cap JSON responses at 2 MiB. Target-network scanning is not performed in the web process. Production connectors must execute as isolated workers with explicit egress allowlists.

## SBOM and false positives

CycloneDX and SPDX imports retain a document hash and source snapshot, then normalise components for repeatable matching. Findings can be marked `accepted_risk`, `false_positive`, `resolved`, or `not_affected`; every adjudication has an actor, reason, and audit event. A finding never becomes a score contribution without separately adjudicated evidence.

## APIs and agent access

REST endpoints live below `/api/v1/security` and `/api/v1/monitoring`. GraphQL and tRPC expose read-only finding queries. The TrustForge MCP server exposes `inspect_security_findings`, clearly labelling results as observations rather than certification.
