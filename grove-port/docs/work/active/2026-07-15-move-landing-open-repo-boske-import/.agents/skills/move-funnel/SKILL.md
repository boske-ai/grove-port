---
name: move-funnel
description: >-
  Work folder skill for move landing, public open repo, and Boske import docs.
  Use when executing this folder's plan or editing listed paths.
---

# Work folder: Move landing · open repo · Boske import

**Plan:** [plan.md](../../plan.md)  
**Status:** see [README.md](../../README.md)

Load **@grove-port-implementation** (extends global `@plan-first-implementation`) + this skill.

## Scope

Pivot funnel: `/port` = landing only; grove-port = public MIT Layer 1; Boske = proprietary vendor import. Docs first; website in Boske website repo; Boske import checklist only here.

## Owned paths (for subagents)

| Area | Glob |
|------|------|
| This work folder | `docs/work/active/2026-07-15-move-landing-open-repo-boske-import/**` |
| Architecture | `docs/architecture/three-layers.md` |
| Online converter pivot | `docs/work/active/2026-06-18-online-converter/**` |
| Backlog / README | `TODO.md`, `README.md`, `docs/work/README.md`, `docs/work/skills-registry.yaml` |
| Optional converter cleanup | `apps/converter-web/**`, `scripts/sync-converter-to-boske-website.mjs` |

**Must not touch (this track):** Boske monorepo app code (document only in `boske-import.md`). Adapter packages unless explicitly fixing for public launch.

## Tests

```bash
bun test
bun run build
```

Docs-only waves: no code tests required.

## Phase V (before PR)

1. `/verifier` — if code touched; else confirm doc links resolve
2. `/review-bugbot` — when code changes
3. `/review-security` — when public-repo launch checklist or secrets scan

## Tracks

| ID | Track | Primary doc |
|----|-------|-------------|
| A | Website `/port` | `website-move.md` |
| B | Public open repo | `open-vs-closed.md` |
| C | Boske import | `boske-import.md` |
