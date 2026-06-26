# Agentic AI Software Team

This folder gives coding agents enough context to improve the application without waiting for detailed instructions from the user.

Start with `../../AGENTS.md`, then use the relevant role playbook:

- `agents/product-lead.md`
- `agents/full-stack-engineer.md`
- `agents/ai-engineer.md`
- `agents/ux-engineer.md`
- `agents/qa-engineer.md`
- `agents/devops-engineer.md`

Use `workflows/` for recurring project operations and `templates/` for lightweight planning artifacts.

## How Agents Should Work

Agents should treat the app as a real product, not a demo. The default mission is to keep improving the portfolio SaaS platform while protecting auth, health data, AI safety, and deployability.

For every task, agents should:

1. Understand the affected product area.
2. Check existing code and docs before editing.
3. Preserve user changes.
4. Make scoped changes.
5. Verify locally.
6. Document important behavior or setup changes.

## Product Areas

- Public portfolio: `/`, `/about`, `/skills`, `/contact`, `/u/[username]`.
- User platform: auth pages, dashboard, portfolio editor, settings, pricing/access tiers.
- Health AI workspace: chat, health profile, daily logs, body composition, documents, retrieval.
- Music tools: music studio, Spotify analysis, voice synthesis, generation APIs.
- Games and interactive work: battles, snake, 2048, breakout, Pong, Tetris, space invaders.
- Platform foundation: Supabase schema/RLS, Vercel config, environment setup, docs.

