# ADR 0002: Preserve append-only trust and reputation history

- Status: Accepted
- Date: 2026-07-12

## Context

Trust decisions must be reproducible after evidence, methodology, verification, moderation, or community state changes.

## Decision

Evidence revisions supersede prior evidence instead of rewriting it. Trust-score calculations create immutable versioned results and components. Reputation changes are ledger events. Moderation and claim attempts retain state history through audit events and terminal records.

## Consequences

Storage grows over time and current-state queries require indexes or projections. In return, decisions can be explained, appealed, audited, and recalculated without losing historical context.
