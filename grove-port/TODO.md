# Grove Port — Backlog

Last updated: 2026-06-18

**Active work:** [`docs/work/active/`](./docs/work/active/)

---

## P0 — Foundation (document + extract)

| Status | Item | Work folder |
|--------|------|-------------|
| ⬜ | Finalize v1 spec markdown (align with Boske `export-v1.ts`) | [`2026-06-18-grove-port-foundation`](./docs/work/active/2026-06-18-grove-port-foundation/) |
| ⬜ | Extract `packages/schema` from `@boske/data-provider` | foundation |
| ⬜ | CLI: `grove-port verify`, `grove-port inspect` | foundation |
| ⬜ | Wire compatibility test vs Boske ExportService output | foundation |

---

## P1 — Migration funnel (business critical)

| Status | Item | Work folder |
|--------|------|-------------|
| ⬜ | IN adapter: **ChatGPT** (`conversations.json`) | foundation |
| ⬜ | IN adapter: **Claude** export | TBD |
| ⬜ | IN adapter: **Mistral Le Chat** export | TBD |
| ⬜ | IN adapter: **Open WebUI** JSON export | TBD |
| ⬜ | Optional: AMP/PAM → Grove (reuse existing converters) | TBD |
| ⬜ | **Online converter** on boske.dev (upload → download `.grove-port`) | [`2026-06-18-online-converter`](./docs/work/active/2026-06-18-online-converter/) |
| ⬜ | Boske import: “Import Grove Port” + preview counts | Boske monorepo (ADR 0009) |

---

## P2 — Adapters + outreach

| Status | Item | Notes |
|--------|------|-------|
| ⬜ | IN adapter: LibreChat JSON | Chat-only; files manual today |
| ⬜ | IN adapter: Open WebUI SQLite (`webui.db`) | Harder; knowledge base |
| ⬜ | OUT adapter: Open WebUI (optional) | Community contribution |
| ⬜ | Publish `github.com/boske-ai/grove-port` | After schema + ChatGPT adapter |
| ⬜ | boske.dev landing: “Move your AI workspace to Boske” | Links converter + docs |

---

## P3 — Grove ecosystem (separate tracks)

See [`docs/ecosystem/grove-family.md`](./docs/ecosystem/grove-family.md).

| Status | Project | Brand |
|--------|---------|-------|
| ⬜ | Grove Guard — MCP policy gateway | Community |
| ⬜ | Grove Fit — hardware / model fit | Labs |
| ⬜ | Grove Pack — assistant pack spec | Labs |
| ⬜ | Grove Index — RAG index lifecycle | Community/Labs |
| ⬜ | Grove Trust — GGUF provenance | Labs |

---

## Done

| Date | Item |
|------|------|
| 2026-06-18 | Repo scaffold + docs + work folders |
| 2026-06-18 | Published [`github.com/boske-ai/grove-port`](https://github.com/boske-ai/grove-port) (**private**) |
