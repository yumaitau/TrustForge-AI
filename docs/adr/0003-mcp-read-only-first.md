# ADR 0003: Expose read-only MCP trust tools first

- Status: Accepted
- Date: 2026-07-12

## Context

MCP tools are model-controlled and registry content can contain malicious or misleading instructions. TrustForge mutations also require tenant authorization, human accountability, and audit context.

## Decision

Phase 3 exposes only read-only MCP tools. Responses are structured, cite evidence identifiers where available, and label uncertainty. Remote MCP inspection enumerates declared primitives but does not invoke them. Mutations remain authenticated REST/tRPC operations until delegated authorization and confirmation semantics are designed.

## Consequences

Agents can safely discover and explain trust data without obtaining registry mutation authority. Later write tools will require scoped OAuth, explicit confirmation, idempotency, and audit events.
