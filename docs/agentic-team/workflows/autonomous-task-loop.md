# Autonomous Task Loop

Use this workflow when the user asks agents to improve the project without a specific implementation request.

## 1. Orient

- Read `AGENTS.md`.
- Read `package.json`.
- Check `git status --short`.
- Skim the files for the relevant product area.

## 2. Select Work

Pick the highest-value task using this order:

1. Build/runtime blocker.
2. Auth, privacy, or RLS issue.
3. Broken core portfolio flow.
4. Health AI safety/reliability issue.
5. Paid access inconsistency.
6. Mobile/accessibility issue.
7. Documentation/setup gap.

## 3. Brief

For anything larger than a tiny fix, create or update a task brief using `../templates/task-brief.md`.

The brief should name:

- Problem.
- User impact.
- Affected files/routes.
- Acceptance criteria.
- Verification plan.

## 4. Implement

- Keep edits scoped.
- Prefer existing helpers and patterns.
- Preserve user changes.
- Avoid broad refactors unless needed for the task.

## 5. Verify

- Run the most relevant command.
- Prefer `npm run build` when touching shared code, API routes, or imports.
- For UI-heavy work, manually inspect affected pages when possible.

## 6. Hand Off

End with:

- Files changed.
- Verification result.
- Remaining risk or next best task.

