# Global IN adapters — Gemini, Doubao, DeepSeek, LobeChat, AnythingLLM

**Status:** Approved — implemented  
**Started:** 2026-06-22

**Invoke:** `@grove-port-implementation` · `@global-in-adapters`

Add Grove Port IN adapters for high-volume **non-EU** migration sources: US big tech (Gemini), China SaaS (Doubao, DeepSeek), and global OSS hubs (LobeChat, AnythingLLM).

## Scope

| Wave | Platform | `source_format` | Input | Status |
|------|----------|-----------------|-------|--------|
| 1 | Google Gemini | `gemini-takeout-v1` | Google Takeout ZIP (My Activity → Gemini Apps) | Done |
| 2 | Doubao 豆包 | `doubao-export-v1` | Official bulk ZIP (`metadata.json` + `chat_*`) | Done |
| 3 | DeepSeek | `deepseek-export-v1` | Settings → Export Data ZIP (`conversations.json`) | Done |
| 4 | LobeChat | `lobechat-export-v1` | Per-chat OpenAI-format JSON (+ optional full DB export later) | Done |
| 5 | AnythingLLM | `anythingllm-export-v1` | Workspace chat JSON / JSONL export | Done |

## Annex (research only — low priority)

Grok, Perplexity, Microsoft Copilot, Meta AI — no official bulk export; document extension-normalized paths in [`research-low-priority.md`](./research-low-priority.md). No adapter code until a stable `source_format` is chosen.

## Out of scope

- Mistral ([ADR 0001](../../decisions/0001-no-mistral-support.md))
- Browser-only scraping inside boske.dev/move (adapters read **files** only)
- LobeChat / AnythingLLM Postgres DB adapters (wave 2 follow-up)
- OUT adapters

See [`plan.md`](./plan.md) and [`research-low-priority.md`](./research-low-priority.md).
