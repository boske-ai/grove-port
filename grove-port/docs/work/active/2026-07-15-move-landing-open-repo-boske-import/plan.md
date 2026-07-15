# Plan — Move landing · public open repo · Boske import

**Status:** Approved  
**Depends on:** shipped adapters + CLI; Boske ADR 0009 (import strategy)

---

## Goal

Ship a clean funnel:

1. **`/port`** explains Grove Port and routes users to Boske (no processing).
2. **Public grove-port repo** exposes only Layer 1 (spec + CLI + adapters).
3. **Boske app** implements vendor import using `@grove-port/adapter-*` (closed UX).

---

## Track A — Website `/port` (landing only)

**Repo:** Boske website (`apps/boske/apps/website`) + optional cleanup in this repo’s `apps/converter-web`.

### Do

- [x] Rewrite `/port` as marketing landing (hero, how-it-works, supported sources, privacy, CLI note, CTAs)
- [x] Remove upload / PortPreview mock from production landing
- [x] Keep “How to export” / supported sources table
- [x] Primary CTA → Boske; secondary → GitHub spec + CLI note
- [x] Mark `converter-web` + sync script as **dev-only** (not production)

### Don’t

- Upload, Web Worker convert, or “download `.grove-port`” as main path on boske.dev

### Done when

- [x] Production `/port` never processes user files
- [x] Privacy copy: boske.dev does not receive exports
- [x] Supported sources table matches shipped adapters (incl. ChatGPT shards)

**Detail:** [`website-move.md`](./website-move.md)

---

## Track B — Public open repository

**Repo:** `github.com/boske-ai/grove-port` (today: private; target: public MIT)

### Do

- [x] Confirm **open surface** = this repo’s OSS packages only (see [`open-vs-closed.md`](./open-vs-closed.md))
- [ ] Repo visibility → **public** when launch checklist passes ([`launch-checklist.md`](./launch-checklist.md))
- [x] Root README states open vs closed clearly
- [x] LICENSE MIT present; no secrets / `.env` / user fixtures (scan in launch checklist)
- [ ] Optional: publish npm `@grove-port/schema`, `core`, `adapter-*`, `cli`
- [x] Keep Boske monorepo, website CMS, Pulse, Labs packs **out** of this repo

### Nested layout note

GitHub has a nested `grove-port/` folder from the community monorepo push. **Waived for launch:** keep nested; README + CONTRIBUTING document `cd grove-port`. Flatten to repo root is optional later.

### Done when

- [x] Local `bun install && bun run build && bun test` works (96 pass, 2026-07-15)
- [x] README describes funnel without browser converter as production path
- [x] No proprietary Boske app code in the public tree
- [ ] Launch checklist signed off; visibility flipped (**manual ops**)

**Detail:** [`open-vs-closed.md`](./open-vs-closed.md) · [`launch-checklist.md`](./launch-checklist.md)

---

## Track C — Boske import (closed product)

**Repo:** Boske monorepo — Waves 1–3 complete there (see Boske work folder `2026-07-15-grove-port-vendor-import`).

### Do (in Boske)

- [x] Work folder `docs/work/active/2026-07-15-grove-port-vendor-import/` + skill registry
- [x] Settings → Data import: clearer Grove Port stub (disabled CTA, sources list, GitHub link)
- [x] Accept vendor exports (ZIP/JSON) + optional `.grove-port` (Wave 2)
- [x] Detect → preview → confirm → map to Boske DB (Wave 2–3)
- [x] Depend on `@grove-port/adapter-*` + `core` + `schema` (Wave 2 — sibling/`GROVE_PORT_ROOT` bridge; npm deferred)
- [x] Large-file path; optional post-import `.grove-port` download (Wave 3)
- [ ] Zip-bomb decompression budgets in Grove Port core (shared follow-up; hosts enforce upload limits)

### Don’t open-source

- Import wizard UI, ImportService, DB mappers, rollback, cloud, teams

### Done when

- [x] User can import ChatGPT ZIP in Boske and see conversations
- [x] Preview shows counts before commit
- [x] `/port` CTA lands on this flow (or Local download + in-app import)

**Detail:** [`boske-import.md`](./boske-import.md) · Boske work folder `2026-07-15-grove-port-vendor-import`

---

## Owned paths (this repo)

| Track | Paths |
|-------|--------|
| A | Boske `apps/website` `/port` + messages; grove-port `apps/converter-web/README.md`, sync script comment |
| B | grove-port `README.md`, `LICENSE`, `launch-checklist.md` |
| C | Boske `docs/work/...vendor-import/**`, `ImportConversations.tsx`, EN strings |

**Serial-only:** `three-layers.md`, `TODO.md`, GitHub visibility flip (ops).

---

## Parallelism verdict (2026-07-15)

**PASS** — A / B / C owned_paths disjoint (overlap-auditor). Executed in parallel.

---

## Retired plan items

From [`2026-06-18-online-converter`](../2026-06-18-online-converter/):

| Old | New |
|-----|-----|
| Phase 2 convert-on-web → API handoff | **Cancelled** — import lives in Boske |
| Client convert as production funnel | **Cancelled** — landing only |
| Converter embed on marketing site | **Retired** from `/port` |
