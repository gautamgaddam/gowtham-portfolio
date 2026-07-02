---
name: three-health-avatar
description: Use when improving the Health AI Three.js avatar, body-region hit testing, canvas sizing, zoom/rotation controls, focus labels, and avatar performance.
---

# Three Health Avatar

Use this skill for the symbolic 3D health avatar in the health workspace.

## Rules

- Treat the avatar as a coaching focus selector, not a diagnostic surface.
- Keep canvas dimensions stable with a defined height/aspect ratio.
- Keep controls compact and clearly labeled.
- Preserve click/raycast region selection and manual highlights.
- Dispose Three.js geometry/materials/renderers on cleanup.
- Verify the canvas is nonblank after layout changes.

## UX Requirements

- Show selected system and region near the avatar.
- Surface profile/tracker/manual signals separately.
- Primary actions should be obvious: Ask Coach, Find Videos, Log Symptom, Clear Focus.
