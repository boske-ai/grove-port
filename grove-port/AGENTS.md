# AGENTS.md — Conventions for AI assistants working on Grove Port

Entry point for Cursor, Codex, Claude, and other coding agents.

**Before doing anything:** read [`README.md`](./README.md). **Backlog:** [`TODO.md`](./TODO.md) → [`docs/work/`](./docs/work/).

---

## Core workflow

1. **Plan first.** Non-trivial changes start with a work folder in [`docs/work/active/`](./docs/work/active/) containing at minimum `README.md` and `plan.md`.
2. **Ask before deviating.** If the approved plan needs to change mid-flight, stop and confirm.
3. **Docs alongside every change.** Behavior changes update the doc that describes them in the same PR.
4. **Small PRs, focused scope.** Minimal edits; no drive-by refactors.
5. **Archive, don't delete.** Move retired code/docs to `_archive/` via `git mv`.

---

## Cursor stack

| Layer | Invoke | Location |
|-------|--------|----------|
| Global phases | `@plan-first-implementation` | `~/.cursor/skills/` |
| This repo | `@grove-port-implementation` | `.cursor/skills/grove-port-implementation/` |
| Work folder | `@<slug>` | `docs/work/active/<folder>/.agents/skills/<slug>/` |
| Generic subagents | `/research-readonly`, `/overlap-auditor`, `/verifier` | global `~/.cursor/agents/` |
| Implementers | see `.cursor/README.md` | `.cursor/agents/` |

Reload Cursor after pulling agent config: **Developer: Reload Window**.

---

## Tooling

- **Package manager:** bun
- **Tests:** `bun test` (all packages) · `bun run build` (schema → core → adapters → CLI) · `bun run schema:emit` (regenerate JSON schema from TypeScript)

---

## Development principles

- **Test-driven development** where tests apply — failing test first.
- **Assert early** — catch logic bugs at boundaries.
- **Avoid fallbacks** — fail fast; no silent defaults that hide misconfiguration.
- **Minimal complexity** — simplest working solution; no speculative abstractions.

---

## What NOT to do

- Do not commit secrets (`.env`, credentials).
- Do not skip plan approval for non-trivial code changes.
- Do not commit user export fixtures or `.grove-port` artifacts from local runs.

---

## When unsure

Ask. A short clarifying question beats an implementation that has to be undone.
