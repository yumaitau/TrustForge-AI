# Continuous monitoring

Monitoring targets cover releases, repositories, vulnerabilities, ownership, domains, certificates, incidents, and disclosures. A target has a source, bounded interval, jittered next-check time, and explicit tenant ownership.

Due work is claimed atomically, represented by a leased `monitoring_run`, and stores before/after state. Material changes create a transactional-outbox event with an idempotency key. The outbox retries with exponential delay and moves events to a dead-letter state after five attempts. Monitoring changes enqueue score recalculation using the preserved subject and state transition.

The in-process scheduler is a development/single-node bridge. It can be disabled with `TRUSTFORGE_DISABLE_IN_PROCESS_WORKER=true`. Production deployments run the same worker functions in dedicated, egress-controlled worker containers; queue transport can be replaced without changing the outbox contract. Alert subscriptions currently record in-app, email, or webhook intent; delivery adapters are a Phase 7 follow-on.
