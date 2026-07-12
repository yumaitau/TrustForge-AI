# Future-expansion and research program

Phase 10 provides a governed backlog for emerging ecosystems, trust research, standards participation, federation, and new assurance techniques — durable evaluation without destabilising delivery.

## Proposal lifecycle

`draft → submitted → in_review → approved → in_progress → completed → promoted`, with `rejected` reachable from review or execution. The state machine (`lib/research/lifecycle.ts`) is deterministic and enforces every gate:

- **Submission** requires a testable hypothesis, explicit exit criteria, and a data-protection plan.
- **Approval** requires recorded ethics and security reviews (latest review of each kind must approve). Owners cannot review their own proposals.
- **Completion** requires a published outcome (text plus optional URL).
- **Rejection** requires a retained rationale; rejected proposals are immutable terminal records — ideas are never silently discarded.
- **Promotion** requires a scoped delivery issue URL, closing the loop back into the roadmap (the promoted issue follows the standard issue contract in docs/roadmap.md).

Every transition and review is audit-logged.

## Separation from production

Research experiments are isolated from production scoring by construction: the research domain (`lib/research/`, `db/schema/research.ts`) has no imports from, or write paths into, trust scoring, evidence, or registry modules. The mandatory data-protection plan covers user and vendor data handling in research datasets; synthetic or anonymised data is the default expectation.

## API

- `GET|POST /api/v1/research/proposals` (`research:propose` — owner/admin/analyst)
- `PATCH /api/v1/research/proposals/:id` — lifecycle transition (`research:manage` — owner/admin)
- `POST /api/v1/research/proposals/:id/reviews` — ethics/security review (`research:manage`, not the proposal owner)

## Standing research directions

Seeded from the roadmap's future enhancements: federated global trust registries, verifiable AI identity, economic risk models, hardware attestation, and machine-readable assurance standards. Each becomes a proposal with its own hypothesis and exit criteria rather than an open-ended workstream.
