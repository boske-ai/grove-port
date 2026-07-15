# P2 IN adapters — LibreChat + browser parity

**Status:** ✅ **shipped** (2026-06-21) — archived

**Invoke:** `@grove-port-implementation`

Add LibreChat JSON export adapter and enable Mistral in the browser converter (CLI already supported).

## Scope

| Adapter | Input | `source_format` |
|---------|-------|-----------------|
| LibreChat | Single `.json` or ZIP of conversation exports | `librechat-export-v1` |
| Mistral (browser) | Same as CLI — wire existing adapter into convert-browser | `mistral-vibe-export-v1` |

## Out of scope

- LibreChat attachments (file references only in preview counts)
- Open WebUI SQLite (`webui.db`)
- Boske import handoff (online-converter Phase 2)

See [`plan.md`](./plan.md).
