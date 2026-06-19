# Grove Port — Backlog

Last updated: 2026-06-19

**Active work:** [`docs/work/active/`](./docs/work/active/)

---

## P0 — Foundation (in progress)

| Status | Item | Work folder |
|--------|------|-------------|
| ⬜ | Finalize v1 spec markdown (align with Boske `export-v1.ts`) | [`2026-06-18-grove-port-foundation`](./docs/work/active/2026-06-18-grove-port-foundation/) |
| ⬜ | Extract `packages/schema` from `@boske/data-provider` | foundation |
| ⬜ | CLI: `grove-port verify`, `grove-port inspect` | foundation |
| ⬜ | Wire compatibility test vs Boske ExportService output | foundation |
| ⬜ | IN adapter: **ChatGPT** (`conversations.json`) | foundation |

---

## P1 — Migration funnel (in progress)

| Status | Item | Work folder |
|--------|------|-------------|
| ⬜ | **Online converter** on boske.dev | [`2026-06-18-online-converter`](./docs/work/active/2026-06-18-online-converter/) |
| ⬜ | IN adapter: **Claude** export | TBD |
| ⬜ | IN adapter: **Mistral Le Chat** export | TBD |
| ⬜ | IN adapter: **Open WebUI** JSON export | TBD |
| ⬜ | Boske import: “Import Grove Port” + preview counts | Boske monorepo (ADR 0009) |

---

## P2 — New Grove projects

| Status | Project | Work folder |
|--------|---------|-------------|
| ⬜ | **Grove Sign** — shared ed25519 (extract first) | [`2026-06-19-grove-sign`](./docs/work/active/2026-06-19-grove-sign/) |
| ⬜ | **Grove Guard** — MCP policy gateway | [`2026-06-19-grove-guard`](./docs/work/active/2026-06-19-grove-guard/) |
| ⬜ | **Grove Vault** — MCP credential broker | [`2026-06-19-grove-vault`](./docs/work/active/2026-06-19-grove-vault/) |
| ⬜ | **Grove Pack** — assistant pack spec | [`2026-06-19-grove-pack`](./docs/work/active/2026-06-19-grove-pack/) |
| ⬜ | **Grove Bridge** — OUT adapters (not a trap) | [`2026-06-19-grove-bridge`](./docs/work/active/2026-06-19-grove-bridge/) |
| ⬜ | **Grove Index** — RAG index lifecycle | [`2026-06-19-grove-index`](./docs/work/active/2026-06-19-grove-index/) |
| ⬜ | **Grove Trust** — model provenance | [`2026-06-19-grove-trust`](./docs/work/active/2026-06-19-grove-trust/) |
| ⬜ | **Stack A Search** — SearXNG self-host kit | [`2026-06-19-stack-a-search`](./docs/work/active/2026-06-19-stack-a-search/) |

**Use cases:** [`docs/ecosystem/use-cases.md`](./docs/ecosystem/use-cases.md) · **Extracts:** [`docs/ecosystem/boske-extracts.md`](./docs/ecosystem/boske-extracts.md)

---

## P3 — Adapters + outreach

| Status | Item | Notes |
|--------|------|-------|
| ⬜ | IN adapter: LibreChat JSON | Chat-only; files manual today |
| ⬜ | IN adapter: Open WebUI SQLite (`webui.db`) | Harder; knowledge base |
| ⬜ | OUT adapter: Open WebUI (optional) | Community contribution |
| ⬜ | Publish `github.com/boske-ai/grove-port` | After schema + ChatGPT adapter |
| ⬜ | boske.dev landing: “Move your AI workspace to Boske” | Links converter + docs |

---

## Done

| Date | Item |
|------|------|
| 2026-06-18 | Repo scaffold + docs + work folders |
| 2026-06-18 | Published [`github.com/boske-ai/grove-port`](https://github.com/boske-ai/grove-port) (**private**) |

---

## Elsewhere (reference only)

| Project | Owner | Status |
|---------|-------|--------|
| Boske Pulse | `boske-pulse/` | Done |
| Grove Fit | `boske-labs/grove-fit/` | In progress |
