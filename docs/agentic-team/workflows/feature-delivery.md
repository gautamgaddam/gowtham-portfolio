# Feature Delivery Workflow

Use this workflow when adding or extending an application feature.

## Product Shape

Before coding, identify:

- The user workflow.
- The route or API endpoint.
- The data model.
- The access tier.
- The expected success and failure states.

## Implementation Order

1. Data contract and access rules.
2. API behavior and validation.
3. UI state and interactions.
4. Error, empty, loading, and locked states.
5. Documentation and verification.

## Required Reviews

- Product Lead: Does this solve the intended workflow?
- Full-Stack Engineer: Is the implementation aligned with existing patterns?
- UX Engineer: Is it usable on mobile and desktop?
- QA Engineer: Is the verification enough for the risk?
- DevOps Engineer: Did setup or deployment change?
- AI Engineer: Required only when prompts, model calls, health data, or document processing change.

