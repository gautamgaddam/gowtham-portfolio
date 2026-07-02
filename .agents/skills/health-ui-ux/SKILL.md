---
name: health-ui-ux
description: Use when designing or modifying the Health AI workspace UI, including chat UX, split-panel layout, tool navigation, state feedback, and responsive behavior.
---

# Health UI/UX

Use this skill for `/dashboard/health` and related health workspace components.

## Priorities

- Keep chat and health cockpit usable at the same time.
- Make save, loading, streaming, stopped, empty, and error states visible.
- Keep health actions fast: ask, stop, save, open history, choose avatar focus, log tracker item.
- Preserve medical safety language and avoid diagnostic claims from UI labels.

## Layout Rules

- Prefer a split workspace on desktop: chat left, health cockpit right.
- Keep composer fixed and reachable.
- Keep tool navigation grouped: Chat, Avatar, Tracker, Plans, Library, Settings.
- On mobile, stack panels and avoid horizontal overflow.
- Use compact controls in panels; do not place cards inside cards.

## Verification

- Check desktop and mobile widths.
- Verify chat scroll, composer, history drawer, avatar controls, panel resize, and all tabs.
