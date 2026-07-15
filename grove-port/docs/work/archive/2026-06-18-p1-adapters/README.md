# P1 IN adapters — Claude, Open WebUI

**Status:** ✅ **shipped** (2026-06-18) — archived to [`docs/work/archive/2026-06-18-p1-adapters/`](../archive/2026-06-18-p1-adapters/)

> **Note:** Mistral was shipped briefly then **retired** ([ADR 0001](../../decisions/0001-no-mistral-support.md)). Adapter archived at `packages/adapters/_archive/mistral/`.

**Invoke:** `@grove-port-implementation`

Add Grove Port IN adapters for the P1 migration funnel while real ChatGPT/Claude exports are prepared for validation.

## Scope

| Adapter | Input | `source_format` |
|---------|-------|-----------------|
| Claude | `conversations.json` / Anthropic export ZIP | `claude-export-v1` |
| Open WebUI | JSON export (standard or legacy) | `openwebui-export-v1` |

## Out of scope

- Attachments binary packing (preview counts only for now on Claude)
- Online converter UI
- Boske DB import

See [`plan.md`](./plan.md).
