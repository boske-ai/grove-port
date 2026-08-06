---
name: global-in-adapters
description: >-
  Work folder skill for global IN adapters (Gemini, Doubao, DeepSeek, LobeChat,
  AnythingLLM). Use when executing docs/work/active/2026-06-22-global-in-adapters/.
disable-model-invocation: true
---

# Work folder: Global IN adapters

**Plan:** [plan.md](../plan.md) · **Research:** [research-low-priority.md](../research-low-priority.md)  
**Status:** (from README.md)

Load **@grove-port-implementation** + this skill.

## Scope

Five IN adapters for non-EU global migration sources. One package per wave under `packages/adapters/<name>/`.

## Owned paths (per wave — disjoint)

| Wave | Implementer owns |
|------|------------------|
| 1 | `packages/adapters/gemini/**` |
| 2 | `packages/adapters/doubao/**` |
| 3 | `packages/adapters/deepseek/**` |
| 4 | `packages/adapters/lobechat/**` |
| 5 | `packages/adapters/anythingllm/**` |

**Serial (parent agent only):** `packages/cli/src/adapters.ts`, `packages/convert-browser/src/*`, root `package.json`, `apps/converter-web/src/platform-picker.ts`, `apps/converter-web/src/compatibility.ts`

## Suggested implementation order

Doubao → DeepSeek → Gemini → LobeChat → AnythingLLM

## Tests

```bash
bun test packages/adapters/<wave>
bun run build
```

## Phase V

`/verifier` → `/review-bugbot` → `/review-security` (export parsing paths)
