# Grove Port — Backlog

Last updated: 2026-07-15

**Active work:** [`docs/work/active/`](./docs/work/active/)

---

## P0 — Foundation (document + extract)

| Status | Item | Work folder |
|--------|------|-------------|
| ✅ | Finalize v1 spec markdown (align with Boske `export-v1.ts`) | [`2026-06-18-grove-port-foundation`](./docs/work/archive/2026-06-18-grove-port-foundation/) |
| ✅ | Extract `packages/schema` from `@boske/data-provider` | foundation |
| ✅ | CLI: `grove-port verify`, `grove-port inspect`, `convert --from chatgpt` | foundation |
| ✅ | IN adapter: **ChatGPT** (`conversations.json` / export ZIP) | foundation |
| ✅ | Wire compatibility test vs Boske ExportService output | foundation |

---

## P1 — Migration funnel (business critical)

| Status | Item | Work folder |
|--------|------|-------------|
| ✅ | IN adapter: **Claude** export | [`2026-06-18-p1-adapters`](./docs/work/archive/2026-06-18-p1-adapters/) |
| ❌ | IN adapter: **Mistral Le Chat** export | Retired — [ADR 0001](./docs/decisions/0001-no-mistral-support.md) |
| ✅ | IN adapter: **Open WebUI** JSON export | [`2026-06-18-p1-adapters`](./docs/work/archive/2026-06-18-p1-adapters/) |
| ⬜ | Optional: AMP/PAM → Grove (reuse existing converters) | TBD |
| 🟡 | **`/port` landing** (no upload) + retire converter embed | [`2026-07-15-move-landing-open-repo-boske-import`](./docs/work/active/2026-07-15-move-landing-open-repo-boske-import/) |
| ✅ | **Public open repo** [boske-ai/grove-port](https://github.com/boske-ai/grove-port) | same |
| ✅ | **Boske import:** Wave 3 complete (multi-adapter UI + rollback + .grove-port download) | Boske monorepo |
| ⬜ | **ZIP bomb budgets** in adapters/`unzipSync` (entry count, uncompressed bytes, ratio) | hardening |
| 🗂️ | Online converter Phase 1 (embed) — **pivoted** | [`2026-06-18-online-converter`](./docs/work/active/2026-06-18-online-converter/) |

---

## P2 — Adapters + outreach

| Status | Item | Work folder |
|--------|------|-------------|
| ✅ | **Global IN adapters** — Gemini, Doubao, DeepSeek, LobeChat, AnythingLLM | [`2026-06-22-global-in-adapters`](./docs/work/active/2026-06-22-global-in-adapters/) |
| ✅ | IN adapter: LibreChat JSON | [`2026-06-21-p2-adapters`](./docs/work/archive/2026-06-21-p2-adapters/) |
| ✅ | ChatGPT **sharded** ZIP (`conversations-NNN.json`) | adapter-chatgpt |
| ⬜ | IN adapter: Open WebUI SQLite (`webui.db`) | Harder; knowledge base |
| ⬜ | Optional: AMP/PAM → Grove | Tier A — reuse converters |
| ⬜ | OUT adapter: Open WebUI (optional) | Community contribution |
| ✅ | boske.dev `/port` landing (no converter) | move-landing track A |
| ⬜ | Optional: publish npm `@grove-port/*` | deferred |

## P2b — Global long tail

See tier tables in [`docs/architecture/core-and-adapters.md`](./docs/architecture/core-and-adapters.md#global-migration-targets-outside-eu-focus).

| Status | Item | Export type |
|--------|------|-------------|
| ⬜ | Kimi 月之暗面 | Extension-normalized JSON |
| ⬜ | Tencent Yuanbao 元宝 | Extension-normalized JSON |
| ⬜ | Qwen / Tongyi 通义千问 | Extension-normalized JSON |
| ⬜ | Grok / Perplexity / Copilot / Meta AI extraction | Research only |
| ⬜ | Ernie 文心一言 / Spark / Zhipu | Research — weak exports |

---

## Done

| Date | Item |
|------|------|
| 2026-06-18 | Repo scaffold + docs + work folders |
| 2026-06-21 | Mistral adapter retired (ADR 0001) |
| 2026-06-21 | LibreChat IN adapter |
| 2026-06-22 | Global IN adapters — Gemini, Doubao, DeepSeek, LobeChat, AnythingLLM |
| 2026-07-15 | Public MIT launch — [boske-ai/grove-port](https://github.com/boske-ai/grove-port) |

**Cursor:** use `@grove-port-implementation` + work-folder skill.
