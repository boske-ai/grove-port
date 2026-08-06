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
- **Full check (what CI runs):** `bun run build && bunx tsc -p tsconfig.test.json --noEmit && bun test`

---

## Hostile input rules (non-negotiable)

Every file this repo parses came from somewhere else. Treat all of it as attacker-controlled.

- **Never call `unzipSync` directly** — use `unzipSyncWithBudgets` from `@grove-port/core/browser`.
- **Bound every traversal.** Vendor exports reference nodes by id, so `JSON.parse` happily produces cycles: every walk needs a `visited` set, and recursion over user-controlled depth must be iterative. Pattern: [`packages/adapters/chatgpt/src/flatten-mapping.ts`](./packages/adapters/chatgpt/src/flatten-mapping.ts).
- **Check size before parsing.** No unbounded `readFile` → `JSON.parse`.
- **`textContent`, never `innerHTML`,** for anything derived from user data.
- **Build adapter manifests with `buildAdapterManifest()`** — don't hand-roll the block; that duplication is what made one schema change a ten-file edit.
- **Verify signatures over raw bytes,** never over a schema-normalized object.
- **Ship a hostile-input test** with any new parser (`hostile-graph.test.ts` in each adapter).

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
