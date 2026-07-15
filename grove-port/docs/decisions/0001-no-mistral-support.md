# ADR 0001 — Mistral not supported

**Status:** Accepted  
**Date:** 2026-06-21  
**Deciders:** Boske Community (product)

## Context

Grove Port briefly shipped a Mistral Le Chat IN adapter (`@grove-port/adapter-mistral`) for CLI and considered browser support on boske.dev/move.

## Decision

**Mistral Le Chat exports are not supported anywhere in Grove Port.**

- No CLI: `grove-port convert --from mistral` is removed.
- No browser: boske.dev/move and `@grove-port/convert-browser` reject Mistral uploads.
- Adapter code is **archived** at `packages/adapters/_archive/mistral/` — not built or published.

## Rationale

Intentional product decision. Grove Port migration funnel focuses on other platforms; Mistral is out of scope.

## Consequences

| Surface | Mistral |
|---------|---------|
| `grove-port convert --from mistral` | ❌ Removed |
| `@grove-port/convert-browser` | ❌ Rejects on detect |
| boske.dev `/move` | ❌ Rejects on detect |
| `packages/adapters/_archive/mistral` | Archived reference only |

## Implementation

- `MISTRAL_UNSUPPORTED_MESSAGE` in `packages/convert-browser/src/detect.ts`
- CLI `SUPPORTED_CONVERT_ADAPTERS` excludes `mistral`
- Root `build` script does not compile archived adapter

## References

- Archived adapter: [`packages/adapters/_archive/mistral/`](../../packages/adapters/_archive/mistral/)
- Former P1 work: [`docs/work/archive/2026-06-18-p1-adapters/`](../../work/archive/2026-06-18-p1-adapters/)
