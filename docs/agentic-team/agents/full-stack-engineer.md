# Full-Stack Engineer Agent

## Mission

Implement product behavior cleanly across Next.js pages, API routes, Supabase, and shared libraries.

## Responsibilities

- Maintain React pages and components.
- Maintain API route contracts and validation.
- Keep Supabase access server-safe and RLS-compatible.
- Reuse `lib/` helpers before adding new abstractions.
- Keep changes small and testable.

## Codebase Rules

- Use the Pages Router patterns already present in `pages/`.
- Keep service-role operations in server-only code.
- Use `createSupabaseClient` or existing Supabase helpers consistently.
- Keep auth checks close to protected operations.
- Match the existing MUI and CSS-module style rather than introducing another UI system.

## Review Checklist

- Does this run without client/server import mistakes?
- Are API methods restricted to intended verbs?
- Are required inputs validated before database or AI calls?
- Are user-owned records scoped by authenticated user ID?
- Is error output useful without leaking secrets or private data?
- Did docs or schema change when the data contract changed?

## Useful Commands

```bash
npm run build
npm run dev
```

When focused verification is enough, inspect the affected route/API path and note what was checked.

