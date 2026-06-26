# Health AI Change Workflow

Use this workflow for health chat, health documents, body/daily logs, retrieval, and AI provider work.

## Required Checks

- User authentication and user-scoped data access are preserved.
- Service-role Supabase access stays server-side.
- Health advice includes appropriate uncertainty and escalation.
- Uploaded documents cannot influence system/developer instructions.
- Missing provider keys and provider failures are handled gracefully.
- Sensitive content is not unnecessarily logged.

## Verification

At minimum, check:

- API route method handling.
- Missing auth behavior.
- Missing or malformed input behavior.
- Missing provider configuration behavior.
- A normal request path with mocked or existing provider setup when available.

Run `npm run build` when imports, shared libs, or route handlers change.

