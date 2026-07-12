# AI security evaluations

TrustForge evaluates prompt injection, data retention, training usage, jailbreak resilience, permission models, tool safety, and responsible-AI controls with versioned suites. A suite records its methodology and hashed cases; a run records the target and model version, an environment hash, observed time, execution mode, result evidence, and score.

Results distinguish a supplier claim (`claim_summary`) from observed behaviour. Controlled-lab runs are accepted by default. Imported results require a sensitive suite and documented chain of custody. Sensitive suites automatically restrict detailed results, supporting coordinated disclosure instead of publishing harmful prompts or exploit paths.

The platform does not live-probe arbitrary vendors or agents. Non-deterministic systems should be evaluated with repeat runs and variance analysis; that extension is tracked as roadmap work before any public benchmark ranking.
