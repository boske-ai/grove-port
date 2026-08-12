# Audit remediation — trust model, adapter hardening, CI

**Status:** Approved  
**Plan:** [plan.md](./plan.md) · **Skill:** `@audit-remediation`

**Started:** 2026-08-06

## What

Close every finding from the Aug 2026 full-repo audit. Three themes:

1. **Trust** — `verify` proved *integrity* while the CLI, `inspect`, and the spec claimed *authenticity*. Signature now covers the raw manifest bytes on disk (not the Zod-normalized object), and every surface says "self-signed" out loud.
2. **Adapters** — the P0 hardening pass secured the envelope/archive layer but never reached the adapters. Cyclic conversation graphs from a hostile or corrupt vendor export could hang or OOM five of the nine adapters; fork resolution was O(n²).
3. **Process** — the repo had no CI. Everything above could regress silently.

## Cursor

| Layer | Invoke |
|-------|--------|
| Repo | `@grove-port-implementation` |
| This folder | `@audit-remediation` |

## Links

- Prior hardening: [`2026-07-22-p0-hardening`](../../archive/2026-07-22-p0-hardening/) — this folder picks up its explicit non-goals
- Spec corrected: [`spec/v1/README.md`](../../../../spec/v1/README.md)
- ADR 0001 (Mistral): [`docs/decisions/0001-no-mistral-support.md`](../../../decisions/0001-no-mistral-support.md)
