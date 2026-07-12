# Enterprise governance

Enterprise catalogues and procurement requests are tenant-scoped. Requests carry a business justification, risk summary, owner, explicit status, and immutable decisions that cite evidence and policy mappings. Only owners and admins decide requests; analysts can submit and assess, enforcing segregation of duties.

Approved entries support renewal and exception expiry. Evidence-library items are classified (`public`, `internal`, `confidential`, `restricted`) and content-addressed. Policies are versioned by organisation/key/version; mappings link controls to subjects and private library evidence.

Audit exports are reproducible manifests with a stable hash and server-side signature. Legal holds are explicit, active records that retention jobs must honour; destructive retention is intentionally deferred until the hold-aware worker is introduced.
