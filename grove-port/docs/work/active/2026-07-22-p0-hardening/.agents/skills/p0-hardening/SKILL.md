---
name: p0-hardening
description: >-
  Work folder skill for P0 hardening (verify path confine, ZIP/tar budgets,
  browser tar). Use when executing this folder's plan or editing listed paths.
paths:
  - docs/work/active/2026-07-22-p0-hardening/**
  - packages/core/**
  - packages/schema/src/v1.ts
  - packages/adapters/*/src/load-input-bytes.ts
  - packages/convert-browser/src/detect.ts
  - TODO.md
---

# Work folder: P0 hardening

**Plan:** [plan.md](../../plan.md)  
**Status:** see [README.md](../../README.md)

Load **@grove-port-implementation** + this skill. **Do not code until README status is Approved.**

## Scope

Verify checksum path confinement, shared ZIP inflate budgets, tar extract budgets, and browser `tar-gzip` / `packEnvelopeBytes` long-name + sanitize fixes.

## Owned paths (for subagents)

| Area | Glob |
|------|------|
| Core | `packages/core/**` |
| Schema (optional) | `packages/schema/src/v1.ts` |
| Adapter ZIP sites | `packages/adapters/*/src/load-input-bytes.ts` |
| Detect | `packages/convert-browser/src/detect.ts` |
| Backlog | `TODO.md` |

## Hot files (never parallel-edit)

- `packages/core/src/envelope.ts`
- `packages/core/src/index.ts`
- `packages/core/src/browser.ts`
- `packages/schema/src/v1.ts`

## Tests

```bash
bun test
bun run build
```

## Phase V (before PR)

1. `/verifier` — tests + diff scope
2. `/review-bugbot`
3. `/review-security` — required (paths, archives, verify)
