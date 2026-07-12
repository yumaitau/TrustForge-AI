# Compliance and sovereign operations

Framework imports retain version, effective date, provenance URL, licence note, source hash, and individual controls. Cross-framework mappings are many-to-many. Assessments model applicability, inheritance, evidence, gaps, and qualified review; reports must say **assessment**, never certification.

Supported catalogue keys include Essential Eight, ISM, IRAP, NIST, CIS, ISO 27001, SOC 2, Privacy Act, and GDPR when an appropriately licensed source is imported. TrustForge does not ship proprietary framework text.

Air-gapped deployments disable in-process remote monitoring (`TRUSTFORGE_DISABLE_IN_PROCESS_WORKER=true`) and provide no mandatory telemetry. Offline update media carries a manifest hash, artifact inventory, network-dependency inventory, and detached signature verified before installation. Operators must test backup/restore against PostgreSQL dumps and object-store versioned backups before production cutover.
