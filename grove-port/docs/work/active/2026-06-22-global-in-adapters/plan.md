# Plan — Global IN adapters

**Status:** Approved  
**Depends on:** shipped ChatGPT / Claude / Open WebUI / LibreChat adapters

---

## Goal

Ship five IN adapters + CLI `convert --from` + browser converter wiring so boske.dev/move supports global competitors outside Europe.

Each adapter follows the established pattern: `types` → `load-input-bytes` → `convert-bytes` → `convert.ts` → `browser.ts` → fixture → tests → CLI registry.

---

## Owned paths (hot files per wave)

| Wave | Package | Also touch |
|------|---------|------------|
| 1 Gemini | `packages/adapters/gemini/**` | `packages/cli`, `packages/convert-browser`, root `build` |
| 2 Doubao | `packages/adapters/doubao/**` | same |
| 3 DeepSeek | `packages/adapters/deepseek/**` | same |
| 4 LobeChat | `packages/adapters/lobechat/**` | same |
| 5 AnythingLLM | `packages/adapters/anythingllm/**` | same |

**Serial only (one agent):** `packages/cli/src/adapters.ts`, `packages/convert-browser/src/index.ts`, `packages/convert-browser/src/detect.ts`, root `package.json` `build` script.

---

## Wave 1 — Google Gemini (Takeout)

### Input

- ZIP from [Google Takeout](https://takeout.google.com/): **My Activity** → deselect all → enable **Gemini Apps** only (not top-level "Gemini" Gems config).
- Known layouts (handle all leniently):
  1. `Takeout/My Activity/Gemini Apps/MyActivity.json` — activity log; group by `titleUrl` conversation ID
  2. `Google Products/Gemini/conversations.json` — `{ conversations: [...] }` with `messages[]`
  3. Per-conversation JSON files under `Gemini/` or `Gemini Apps/`

### Parser strategy

- Detect layout from ZIP entry names
- Activity log: extract ID from `titleUrl` (`/app/c/<id>`), map `details` Request/Response or `userInteractions` blobs
- Fail fast on Gems-only export with message: "Select My Activity → Gemini Apps, not Gemini Gems"

### Done when

- [x] Synthetic fixtures for activity-log + conversations.json layouts
- [x] `grove-port convert --from gemini takeout.zip --preview`
- [x] Verifiable `.grove-port` output
- [x] Browser adapter + detect (ZIP entry heuristics)

**References:** [PAM Google mappings](https://portable-ai-memory.org/providers/google/), ironclaw issue #152

---

## Wave 2 — Doubao 豆包 (bulk ZIP)

### Input

- Official web export: select conversations → **批量导出(.zip)**
- ZIP contains:
  - `metadata.json` — session IDs, timelines, plugin calls
  - `chat_YYYY-MM-DD/*.md` + JSON per conversation
  - `assets/` — uploaded files (SHA-named)

### Parser strategy

- Read `metadata.json` index
- Pair JSON message files with MD fallbacks
- Preview: count conversations, messages, attachment references (bytes optional P2)

### Done when

- [x] Fixture ZIP (minimal synthetic)
- [x] CLI + browser convert
- [x] Document max size guidance in adapter README

**References:** Doubao export blog (2026 ZIP layout), [chat-export-toolkit](https://github.com/gandli/chat-export-toolkit) Doubao adapter skeleton

---

## Wave 3 — DeepSeek

### Input

- **Preferred:** Settings → Privacy/Data → **Export Data** → ZIP with `conversations.json`
- Wire format (per conversation-export-workbench): array or mapping graph with `fragments` types `REQUEST`, `RESPONSE`, `THINK`, `SEARCH`
- **Fallback (document only):** extension JSON — not v1 adapter unless official export unavailable in fixtures

### Parser strategy

- Flatten mapping graph to linear thread (like ChatGPT)
- Strip or annotate `THINK` blocks in preview
- `source_format: deepseek-export-v1`

### Done when

- [x] Fixture from documented schema (synthetic mapping graph)
- [x] CLI + browser convert
- [x] README notes China data residency for user copy

**References:** [conversation-export-workbench](https://github.com/ngallodev-software/conversation-export-workbench) DeepSeek schema docs

---

## Wave 4 — LobeChat

### Input

- Per-session **OpenAI-format JSON** export from LobeChat UI (v1.28+)
- Messages array with `role`, `content`, tool-call payloads
- **Later:** full DB/JSON backup via `dataExporter` tables — separate P3 folder

### Parser strategy

- Map OpenAI messages → Grove messages
- Preserve tool calls as text markers or `tool_calls` collection when schema allows
- Sessions export = one conversation per file; ZIP of multiple JSONs supported

### Done when

- [x] Fixture OpenAI-format JSON
- [x] CLI + browser convert
- [x] Detect: `messages` array + Lobe-specific metadata keys

**References:** [LobeHub changelog 2024-11-06](https://lobehub.com/changelog/2024-11-06-share-text-json)

---

## Wave 5 — AnythingLLM

### Input

- Admin/workspace export from Settings → Chats (requires ≥10 logs in docs)
- Formats: **JSON**, **JSONL** (OpenAI fine-tune), CSV, Alpaca JSON
- v1 adapter targets **JSON** and **JSONL** only

### Parser strategy

- JSONL: one prompt/response pair per line → conversation grouping by `workspace_name` + `id` or thread
- JSON: array of `{ id, username, workspace_name, prompt, response, sent_at }`

### Done when

- [x] Fixtures for JSON + JSONL samples
- [x] CLI + browser convert
- [x] README: self-hosted only; no cloud instance assumptions

**References:** [AnythingLLM chat logs docs](https://docs.anythingllm.com/features/chat-logs)

---

## Cross-cutting (after each wave)

1. Register in `packages/cli/src/adapters.ts`
2. Wire `@grove-port/convert-browser` + `detect.ts`
3. `apps/converter-web` platform picker + compatibility blurb
4. Root `package.json` build filter
5. `bun test` + `bun run build`

---

## Tests

```bash
bun test packages/adapters/gemini
bun test packages/adapters/doubao
# … per wave
bun test
bun run build
bun run build:web:boske   # after browser wiring
```

---

## Done criteria (folder)

- [x] All five adapters: `preview*` + `convert*` → verifiable `.grove-port`
- [x] CLI lists all five in `--from` help
- [x] Browser converter includes all five (except where ZIP-only constraints apply)
- [ ] Low-priority research doc complete for Grok / Perplexity / Copilot / Meta AI
- [ ] `TODO.md` + `core-and-adapters.md` updated per shipped wave

---

## Approval

Plan status: **approved**. Implementation order: **Doubao → DeepSeek → Gemini → LobeChat → AnythingLLM**.
