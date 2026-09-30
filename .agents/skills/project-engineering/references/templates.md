# Project artifact templates

Read this reference when initializing project documents, adding a missing artifact, or restructuring an existing documentation system. Adapt names and numbering to the repository; do not create empty documents that have no current purpose.

## Minimal project spine

For a small but long-lived project, begin with six roles:

```text
AGENTS.md                 enforceable repository rules and invariants
docs/00-product.md        user, problem, outcome, non-goals
docs/01-roadmap.md        staged outcomes and current status
docs/02-architecture.md   domain, state, data flow, dependencies, delivery
docs/80-pitfalls.md       verified non-obvious failures and lessons
docs/85-backlog.md        discovered but deferred work
```

Add design principles for a UI product, API reference for meaningful cross-module contracts, feature specs for boundary-heavy work, and a changelog when releases need a durable user-facing record.

## Product proposal

```markdown
# Product proposal

## One-sentence outcome
## Target users and trigger moments
| User | Trigger | Current alternative | Why it fails |

## Problem definition
## Core mechanism
## Explicit non-goals
## Success measures
## Validated and unvalidated assumptions
```

The core mechanism should explain how the product changes the user's situation. It is not a feature inventory.

## Roadmap

```markdown
# Roadmap

## Stage overview
| Stage | User-visible outcome | Completion signal | Status | Detail |

## Current stage
| ID | Capability | Acceptance evidence | Status |

## Current blockers
```

Give a stage one dominant outcome. Move implementation detail to its stage record or feature specification.

## Architecture

```markdown
# System architecture

## Context and constraints
## Technology choices and reasons
## Repository/module structure
## Domain types and invariants
## End-to-end data flow
## State ownership and lifecycle
| State | Owner | Storage | Lifetime | Recovery |

## External dependencies
## Security and privacy boundaries
## Observability
## Build, deployment, migration, and rollback
## Known scaling or extension boundaries
```

## Design principles

```markdown
# Design principles

## Experience objective
## Information hierarchy
## Tokens: color, typography, spacing, motion
## Layout and breakpoints
## Shared component patterns
## Loading, empty, success, and error states
## Accessibility
## Explicit anti-patterns
```

## API or contract reference

```markdown
## METHOD /path-or-operation

### Purpose
### Request/input
### Response/output
### Validation and invariants
### Errors and partial failure
### Idempotency, retry, and timeout
### Authorization and data boundary
### Compatibility/versioning
```

## Stage record

```markdown
# Stage X — outcome

## Goal and completion signal
## Capability summary
## Key decisions
| Decision | Choice | Reason | Rejected alternative |

## Dependencies and risks
## Acceptance evidence
## Deliberate exclusions
## Remaining work
```

## Feature specification

```markdown
# Feature name

## Why and user outcome
## Scope and non-scope
## Entry points
## Domain/state changes
## Normal flow
## Failure and recovery flow
## Privacy, permission, cost, and compatibility
## Rollout and rollback
## Acceptance checklist
```

## Pitfall entry

```markdown
### Short symptom

- Symptom:
- Cause:
- Resolution:
- Lesson or prevention:
```

Record only a verified cause. If the cause remains unknown, label it unknown rather than promoting a guess into repository knowledge.

## Definition of done

Adjust to project risk:

```text
implementation complete
-> relevant static checks and tests pass
-> failure paths verified
-> production/package build verified
-> delivery environment checked when material
-> contracts and roadmap synchronized
-> new debt captured
-> rollback or recovery understood
```
