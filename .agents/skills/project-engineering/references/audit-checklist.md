# Project engineering audit checklist

Read this reference when reviewing an existing project's engineering method or documentation health. Use repository evidence; do not infer compliance from document names alone.

## 1. Goal and scope

- Is the target user and trigger moment concrete?
- Is the desired user outcome distinct from the implementation mechanism?
- Are current alternatives and their failure modes stated?
- Are explicit non-goals present and reflected in the implementation?
- Are success measures observable and bounded?

## 2. Roadmap integrity

- Are stages organized around independently valuable outcomes?
- Does every active capability have acceptance evidence?
- Do roadmap state, stage files, backlog, and changelog agree?
- Are abandoned items marked rather than silently left active?
- Is the declared current stage consistent with remaining work?

## 3. Architecture integrity

- Do documented modules and paths exist?
- Are core domain types, invariants, and state ownership clear?
- Can the primary data flow and failure flow be followed end to end?
- Are persistence, privacy, external dependencies, and rollback documented?
- Are implementation choices proportional to current scale?

## 4. Contract integrity

- Do implemented routes/operations appear in the contract reference?
- Do method, path, request, response, validation, and error semantics match code?
- Are streaming, partial failure, retry, timeout, idempotency, and compatibility addressed where applicable?
- Are untrusted outputs validated before persistent or privileged effects?

## 5. Delivery evidence

- Are type checks, tests, and production builds present and meaningful?
- Is there at least one end-to-end vertical-path verification?
- Are real deployment and external integrations verified when local substitutes can hide failures?
- Is the artifact being verified the same artifact that ships?
- Are observability and rollback proportional to impact?

## 6. Knowledge lifecycle

- Are backlog items specific enough to act on?
- Do pitfalls contain symptom, verified cause, resolution, and prevention?
- Have repeated related incidents produced a systemic correction or postmortem?
- Are completed specifications and reviews archived only after references are updated?
- Are historical snapshots clearly labeled so they are not mistaken for current truth?

## 7. Duplication and staleness

- Are the same facts copied into multiple current documents?
- Is a single source of truth named for versions, counts, URLs, product copy, schemas, and status?
- Are verification dates credible relative to recent edits?
- Do internal links resolve?
- Are placeholders, stale environment variables, obsolete commands, or superseded documents still presented as current?

## Reporting format

Report findings in descending impact:

```text
[severity] finding
Evidence: exact file/path and relevant value
Impact: concrete failure or maintenance cost
Correction: smallest durable change
```

After findings, summarize:

- the current project decision chain;
- the strongest existing practice worth preserving;
- the smallest structural improvement that removes the most future cost;
- unresolved questions that require product or owner input.

Do not recommend more documents when consolidation, deletion, automation, or a clearer source of truth solves the issue.
