# Move landing · public open repo · Boske import

**Status:** Approved — A/B/C code+docs done; public flip pending human commit/push + ops  

**Started:** 2026-07-15

**Invoke:** `@grove-port-implementation` · `@move-funnel`

Three parallel tracks (overlap-auditor **PASS** — executed in parallel):

| Track | Where | Job | Status |
|-------|--------|-----|--------|
| **A — Website** | Boske website `/port` | Educate + CTA; **no file upload** | ✅ Landing shipped in website tree |
| **B — Open repo** | `github.com/boske-ai/grove-port` | Spec, schema, CLI, IN adapters — MIT | ✅ Pre-flight re-verified; **commit/push then visibility flip** |
| **C — Boske import** | Boske monorepo | Vendor ZIP → preview → import | ✅ Waves 2–3 shipped in Boske tree |

## Why

- **Privacy:** boske.dev never receives user exports.
- **Product:** conversion UX and DB mapping stay in Boske (closed).
- **Trust:** format + adapters stay open so users can verify and leave.

## Docs of record

| Doc | Role |
|-----|------|
| [`plan.md`](./plan.md) | Waves, owned paths, done criteria |
| [`open-vs-closed.md`](./open-vs-closed.md) | Inventory: what ships OSS vs stays proprietary |
| [`website-move.md`](./website-move.md) | `/port` page content + retire converter |
| [`boske-import.md`](./boske-import.md) | Checklist for Boske app |
| [`launch-checklist.md`](./launch-checklist.md) | Public repo ops checklist |
| [`docs/architecture/three-layers.md`](../../architecture/three-layers.md) | Funnel diagram |

## Out of scope

- Browser converter on production `/port`
- Phase 2 “convert on web → POST tarball” handoff
- Opening Boske app, ImportService UI, DB mapping, cloud, Labs packs
- New long-tail adapters (Kimi, Grok, …)

## Cursor

| Layer | Invoke |
|-------|--------|
| Repo | `@grove-port-implementation` |
| This folder | `@move-funnel` → [`.agents/skills/move-funnel/SKILL.md`](./.agents/skills/move-funnel/SKILL.md) |
| Boske import | `@grove-port-vendor-import` (Boske work folder) |
