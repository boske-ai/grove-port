---
name: packages-implementer
description: >-
  Companion skill for /packages-implementer. Edits under packages/** only.
  TDD, minimal diff, repo conventions from AGENTS.md.
paths:
  - packages/**
---

# packages-implementer

**Subagent:** `/packages-implementer` · **Scope:** `packages/**` only

## Before coding

1. `@grove-port-implementation` + work folder skill + plan wave task
2. [`AGENTS.md`](../../../../AGENTS.md)

## Conventions

- `@grove-port/schema` → `@grove-port/core` → `@grove-port/adapter-*` → `@grove-port/cli` dependency order
- After `packages/schema` edits: `bun run schema:emit`; update `spec/v1/` when wire format changes
- After package edits: `bun run build`
- Follow patterns in owned paths; no drive-by refactors outside scope
- TDD — failing test first where tests exist
- If a change requires editing another implementer's scope → stop; assign to that subagent

## Tests

```bash
bun test
bun run build
```

Report files changed + test output.
