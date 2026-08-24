# Continuous integration

Two GitHub Actions workflows gate the project:

- `CI`: clean install, lint, strict typecheck, unit tests, PostgreSQL migrations, MCP Bun bundle and protocol smoke test against the Bun process, production web build, Chromium onboarding and WCAG checks, production HTTP smoke tests, production dependency audit, and separate web/MCP OCI image builds.
- `CodeQL`: JavaScript and TypeScript security analysis on pushes, pull requests, and a weekly schedule.

The workflows use only repository configuration and ephemeral service containers. They do not require cloud deployment credentials.
