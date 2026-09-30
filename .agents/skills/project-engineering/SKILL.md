---
name: project-engineering
description: Design, initialize, plan, or audit a software project as an outcome-driven engineering system. Use when starting a project from zero, restructuring project documentation, defining stages and architecture, writing feature specifications, or checking whether implementation, documentation, and delivery remain aligned. Do not use for an isolated code change whose product goal and engineering boundaries are already clear.
---

# Project Engineering

Build the smallest engineering system that preserves a traceable chain from user outcome to implementation and verification:

```text
goal and boundaries -> staged outcomes -> architecture and contracts
-> feature specification -> implementation and verification -> retained knowledge
```

Do not copy a mature project's document count into a small project. Start with the minimum artifacts justified by current decision complexity, then add documents when a concrete routing condition below is met.

## First-principles rules

1. Define the problem before choosing technology. Identify the user, trigger moment, current alternative, failure of that alternative, desired outcome, exclusions, and riskiest assumptions.
2. Split stages by independently observable user outcomes, not by frontend/backend/infrastructure layers.
3. Model domain data, ownership, lifecycle, and failure recovery before page structure or framework details.
4. Turn product-critical behavior into enforceable invariants. Assign each invariant to code, schema, storage, authorization, or an explicit human decision; do not leave it only in UI copy or developer memory.
5. Implement the smallest complete vertical slice before broad horizontal infrastructure.
6. Prefer the lowest total lifecycle cost, not the fewest lines today. Account for present complexity, maintenance, failure probability, and migration cost.
7. Verify the artifact that will actually ship. A green working tree is not evidence that the staged commit, package, image, or production deployment is correct.
8. Convert repeated failures into a test, rule, automated check, or architectural correction.

## Select the operating mode

### Start or restructure a project

1. Inspect existing code, documents, repository rules, and delivery environment before proposing structure.
2. Establish the minimal project spine:
   - project rules and invariants;
   - product goal and explicit non-goals;
   - outcome-based roadmap;
   - architecture covering domain types, data flow, state ownership, external dependencies, and deployment;
   - backlog for discovered work;
   - pitfalls log for verified non-obvious lessons.
3. Read [references/templates.md](references/templates.md) and instantiate only the sections supported by known facts.
4. Mark unresolved decisions explicitly. Do not manufacture certainty to fill a template.
5. Define the first vertical slice and its acceptance evidence.

### Plan a stage

1. State the stage outcome and observable completion signal.
2. List capabilities required for that outcome and give them stable stage-local identifiers.
3. Record key decisions as `choice / reason / rejected alternative` when the rejected path is likely to recur.
4. Identify dependencies, migration needs, rollout risks, and what remains deliberately outside the stage.
5. Do not mark implementation activities such as “build frontend” as outcomes.

### Design architecture or a feature

1. Trace the end-to-end data path and ownership boundaries.
2. Define stable domain types and contracts before UI component shape.
3. State normal flow, failure flow, retry/idempotency behavior, persistence, privacy, observability, and rollback.
4. Create a standalone feature spec only when ambiguity or risk justifies it: multiple modules, a real state machine, money/permissions/privacy, irreversible data, several failure paths, or materially different interpretations of done.
5. Keep current contracts in architecture/API documents and historical reasoning in stage or decision records; do not duplicate both everywhere.

### Audit an existing project

1. Read the project's governing instructions and declared sources of truth first.
2. Compare product claims, roadmap status, architecture, contracts, code, tests, deployment, and changelog.
3. Classify findings as:
   - contradiction: two current sources disagree;
   - drift: documentation no longer describes implementation;
   - gap: a material decision, contract, or verification is absent;
   - stale status: completed or abandoned work is still presented as active;
   - duplication: the same fact has competing sources of truth.
4. Read [references/audit-checklist.md](references/audit-checklist.md) and report evidence with exact file locations.
5. Prefer consolidating facts into one source of truth over adding another document.

## Artifact routing

Use names and numbering compatible with the target repository. The following are roles, not mandatory filenames:

| Change or knowledge | Destination |
|---|---|
| User, problem, positioning, non-goals | Product proposal |
| Stage status and completion result | Roadmap |
| Modules, types, state, data flow, deployment | Architecture |
| UI tokens, interaction and accessibility rules | Design principles |
| Cross-module request/response behavior | API or contract reference |
| Complex feature boundaries and acceptance | Feature spec |
| Rejected alternatives and stage reasoning | Stage/decision record |
| Discovered but deferred work | Backlog |
| Verified non-obvious failure | Pitfalls log |
| User-visible shipped change | Changelog |
| Completed spec/review/stage | Archive, after references are updated |

## Quality gates

Scale evidence to risk, but cover three distinct gates:

- Start gate: the target user/outcome, exclusions, acceptance evidence, and direction-changing unknowns are explicit.
- Delivery gate: invariants, types/contracts, normal and failure paths, relevant tests, production build, and documentation synchronization are complete.
- Release gate: the real environment and external dependencies are verified, observability and rollback exist, roadmap/changelog status is current, and remaining work is captured rather than hidden in chat or memory.

Never claim an outcome is complete merely because code exists or a local build passes.

## Output expectations

- Lead with the proposed project system or audit conclusion, then explain supporting decisions.
- Separate facts observed in the repository from recommendations and unresolved questions.
- Use measurable acceptance criteria instead of adjectives such as “robust”, “clean”, or “production-ready”.
- Challenge an incorrect premise before optimizing within it; propose a smaller path when it reaches the same outcome with lower lifecycle cost.
- Preserve the user's scope and authorization. Planning or auditing does not authorize unrelated code, deployment, account, or external-system changes.
