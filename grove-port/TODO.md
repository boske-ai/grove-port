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

## P2 — Grove Vault (**active focus**)

| Status | Item | Work folder |
|--------|------|-------------|
| ⬜ | Handle spec v1 | [`spec/vault-handles-v1.md`](./spec/vault-handles-v1.md) |
| ⬜ | `packages/vault` — Mac Keychain + Linux backends | [`2026-06-19-grove-vault`](./docs/work/active/2026-06-19-grove-vault/) |
| ⬜ | CLI `grove-vault` + `grove-run` | vault |
| ⬜ | Boske Settings → Vault UI | Boske monorepo |
| ⬜ | MCP `{{vault:name}}` substitution | Boske monorepo |

**Paused (draft plans only):** Guard, Pack, Bridge, Index, Trust, Sign, Stack A — see [`docs/work/active/`](./docs/work/active/)

**Docs:** [`docs/ecosystem/competitive-reality-check.md`](./docs/ecosystem/competitive-reality-check.md)

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
