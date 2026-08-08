# Security Policy

## Supported version

Security fixes target the latest code on `main`.

## Reporting a vulnerability

Please use GitHub's private **Report a vulnerability** flow when it is available. Do not open a public issue containing credentials, session data, private learning material, or reproduction steps that would put deployed instances at risk.

Reports are most useful when they include the affected route or component, expected and observed behavior, a minimal reproduction, and the likely impact. Remove all real secrets and personal data before submitting.

## Security boundaries

- Model credentials belong in server-side environment variables only.
- Authentication uses HTTP-only sessions; frontend storage must not contain session secrets.
- Account data and learning records must remain account-scoped.
- State-changing requests must enforce origin checks and rate limits.
- Private source materials must never be added to examples, tests, screenshots, or commits.
