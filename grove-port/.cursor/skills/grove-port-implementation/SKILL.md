---
name: grove-port-implementation
description: >-
  Execute approved Grove Port work folders with parallel subagents and file
  ownership. Extends @plan-first-implementation with repo paths, registry, and hot files.
---

# Grove Port implementation

**Base workflow:** `@plan-first-implementation` (global — phases, approval gates, parallel rules).

This skill adds Grove Port-specific resolution, hot files, and conventions.

## 1. Resolve the work folder

**Priority order:**

1. User names folder or path in prompt
2. [`docs/work/skills-registry.yaml`](../../../docs/work/skills-registry.yaml) — folder slug → skill + plan file
3. [`TODO.md`](../../../TODO.md) — backlog index
4. Glob: `docs/work/active/<folder>/.agents/skills/*/SKILL.md`

**Plan file:** `MASTER.md` (large efforts) · `plan.md` (standard) · `README.md` (status always).

**Before coding:** `README.md` status must be **approved** or **✅ approved**. If draft → stop at Phase R/P only.

## 2. Skill stack

```
@plan-first-implementation               ← global phases
        +
@grove-port-implementation               ← you are here (repo paths + hot files)
        +
@<work-folder-skill>                     ← docs/work/active/<folder>/.agents/skills/<name>/
        +
@<subagent-skill>                        ← global or .cursor/skills/subagents/<name>/
```

**If work folder has no skill yet:** use [`docs/work/_templates/work-folder/.agents/skills/_default/SKILL.md`](../../../docs/work/_templates/work-folder/.agents/skills/_default/SKILL.md). Add skill before multi-agent waves.

## 3. Phase E implementers (Grove Port)

| Subagent | Scope |
|----------|-------|
| `/packages-implementer` | `packages/**` |

Generic phases R, X, V use global `/research-readonly`, `/overlap-auditor`, `/verifier`.

**Phase V ship gate (after tests pass):** `/review-bugbot` on every code wave; add `/review-security` when the wave touches crypto, signatures, export parsing, or user data paths.

## 4. Repo-wide hot files (never parallel-edit)

- `packages/schema/src/index.ts`
- `packages/schema/src/v1.ts`
- `packages/core/src/index.ts`
- `packages/cli/src/cli.ts`
- `package.json` (root workspaces)
- `bun.lock`
- `spec/v1/README.md` (when wire format changes)

Folder `MASTER.md` §7 or work folder skill may add more.

## 5. Grove Port conventions

- [`AGENTS.md`](../../../AGENTS.md) first
- `@grove-port/*` workspace packages; build order: schema → core → adapters → CLI
- After schema edits: `bun run schema:emit`; align `spec/v1/` markdown when wire format changes
- TDD; minimal diff; fail fast

## 6. Parent prompt template

```text
@grove-port-implementation @<work-folder-skill>

Work folder: docs/work/active/<folder>/
Plan: <MASTER.md | plan.md>
Wave: N (or "single pass")

Phase R: /research-readonly
Phase X: /overlap-auditor
Phase E: /…-implementer (disjoint owned_paths)
Phase V: /verifier → /review-bugbot → /review-security (if security-sensitive paths)
```

## 7. New work folder

1. `docs/work/active/<yyyy-mm-dd>-<slug>/` with `README.md` + `plan.md`
2. `.agents/skills/<slug>/SKILL.md` — copy from [`docs/work/_templates/work-folder/`](../../../docs/work/_templates/work-folder/)
3. Add row to [`docs/work/skills-registry.yaml`](../../../docs/work/skills-registry.yaml)
4. Link from [`TODO.md`](../../../TODO.md)
5. Plan approval → Phase E

See [`docs/work/skills-registry.yaml`](../../../docs/work/skills-registry.yaml) for active folders.
