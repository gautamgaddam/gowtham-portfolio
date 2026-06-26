# Agent Operating Manual

This repository is a Next.js portfolio platform that is evolving into a multi-user SaaS product. Agents working here should act as a small software team that improves the product without needing the user to restate the project purpose every time.

## Product Purpose

Build and maintain a personal portfolio platform where users can:

- Create accounts and manage a public portfolio at `/u/[username]`.
- Edit profile, skills, and projects from the dashboard.
- Use premium experiences such as the health AI workspace and music studio.
- Explore interactive portfolio/game experiences that show technical creativity.

The product should feel useful first: stable auth, reliable data, clear UX, safe AI behavior, and deployable code matter more than adding novelty.

## Current Stack

- Framework: Next.js Pages Router with React 18.
- UI: Material UI, Emotion, CSS modules, existing brutalist/dark visual language.
- Backend: Next.js API routes.
- Data/auth/storage: Supabase.
- AI integrations: OpenAI health chat/document processing, ElevenLabs voice, music generation endpoints.
- Deployment target: Vercel.

## Agent Team

Use the playbooks in `docs/agentic-team/agents/`:

- Product Lead: owns scope, priorities, acceptance criteria, and user value.
- Full-Stack Engineer: owns Next.js, Supabase, API routes, and implementation quality.
- AI Engineer: owns health AI, document processing, prompt safety, and model-provider behavior.
- UX Engineer: owns flows, visual consistency, accessibility, and responsive behavior.
- QA Engineer: owns verification, regression checks, and release confidence.
- DevOps Engineer: owns environment setup, deployability, observability, and operational docs.

For larger work, one agent should explicitly act as coordinator and delegate reviews mentally through these roles before editing.

## Default Autonomous Loop

1. Read this file, `package.json`, and the relevant feature files.
2. Check `git status --short` and preserve user changes.
3. Identify the product area being touched: portfolio, auth/dashboard, health AI, music, games, pricing/access, or platform.
4. Write or update a short task brief when work is larger than a single fix. Use `docs/agentic-team/templates/task-brief.md`.
5. Make the smallest coherent change that moves the product forward.
6. Verify with the strongest local check available. Prefer `npm run build` for broad confidence when time allows.
7. Update docs when behavior, setup, environment variables, or data shape changes.
8. Leave a concise final note: changed files, verification, and any residual risk.

## Priorities

When agents choose work autonomously, prioritize in this order:

1. Production blockers: build failures, runtime crashes, broken auth, broken API routes.
2. Data safety and privacy: Supabase RLS, service-role use, health document handling, user isolation.
3. Core portfolio flow: signup, dashboard, portfolio editor, public portfolio rendering.
4. Health AI safety and reliability: medical disclaimers, escalation guidance, document parsing, retrieval quality.
5. Subscription/access control correctness.
6. Mobile and accessibility polish.
7. Music, games, and creative enhancements.
8. Internal cleanup that directly lowers future bug risk.

## Guardrails

- Do not commit secrets, generated `.env.local`, Supabase keys, OpenAI keys, or private user health data.
- Never weaken Row Level Security or expose service-role operations to client code.
- Health AI must not replace professional medical advice. Preserve clear emergency and clinician-escalation behavior.
- Keep changes compatible with the Pages Router unless deliberately migrating with a plan.
- Follow existing import/style patterns before introducing new libraries.
- Do not rewrite unrelated files or reformat the repository.
- Treat uncommitted changes as user-owned unless they were created in the current task.

## Common Commands

```bash
npm run dev
npm run build
npm start
```

The dev server is configured for port `3005`.

## Key Paths

- `pages/`: Next.js pages and API routes.
- `components/`: shared React components and interactive experiences.
- `lib/`: Supabase clients, auth helpers, access logic, AI/document utilities.
- `styles/`: global, theme, and feature CSS.
- `supabase/schema.sql`: database schema and RLS policies.
- `docs/`: setup, testing, and agent-team operating docs.

## Definition of Done

A change is done when:

- The behavior matches the stated product intent.
- User data remains isolated by auth/RLS/API checks.
- The UI works on desktop and mobile for affected screens.
- Build or targeted verification has been run, or the reason it could not run is documented.
- Any new operational requirement is documented.

