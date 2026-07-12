# ADR 0004: Separate observed security intelligence from claims and deliver changes through an outbox

## Status

Accepted — 2026-07-12

## Context

Security data is volatile, source-licensed, and sometimes sensitive. Directly changing a score from a scanner result would hide provenance, make false positives difficult to correct, and couple external polling to user requests.

## Decision

Store source snapshots, advisories, SBOMs, and subject findings separately. Give findings stable deduplication fingerprints and a human adjudication state. Monitoring writes leased runs with before/after state, then creates idempotent transactional-outbox events. Consumers retry and dead-letter events, and only then request recalculation through the existing trust service.

AI security tests are controlled-lab records with suite, environment, and disclosure metadata—not arbitrary remote attacks.

## Consequences

The initial scheduler is intentionally conservative and connector-free in the web process. Dedicated isolated workers and delivery connectors can be added without changing the public domain model. This adds persistence and operations work, but retains the provenance required for explainable trust decisions.
