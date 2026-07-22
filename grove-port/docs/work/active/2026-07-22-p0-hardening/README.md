# P0 hardening — verify confine, archive budgets, browser tar

**Status:** Approved — implementation complete (awaiting PR)  

**Started:** 2026-07-22  
**Approved:** 2026-07-22  
**Phases:** R ✅ · X ✅ · E Waves 1–4 + 1b/1c/2b/3b ✅ · V ✅ (129 tests)  

**Invoke:** `@grove-port-implementation` · `@p0-hardening`

Close the three highest-risk gaps from the Jul 2026 deep audit so Grove Port is safe against hostile packages and large/malicious vendor ZIPs.

| Track | Job |
|-------|-----|
| **A — Verify confine** | Checksum path confinement + envelope layout allowlist |
| **B — Archive budgets** | Shared ZIP budgets for all `unzipSync`; tar extract size/entry caps |
| **C — Browser tar** | Long-name + UTF-8-safe `tar-gzip` + sanitize `storage_name` in `packEnvelopeBytes` |

## Why

- `grove-port verify` must not hash arbitrary local files via crafted checksum keys.
- CLI / converter-web must not OOM or fill `/tmp` on ZIP/tar bombs.
- In-browser ChatGPT convert must produce packages that round-trip through Node verify.

## Docs of record

| Doc | Role |
|-----|------|
| [`plan.md`](./plan.md) | Waves, owned paths, done criteria, proposed limits |
| Deep audit canvas | Findings source (chat session) |
| [`TODO.md`](../../../TODO.md) | Backlog row for ZIP budgets |

## Out of scope (later waves / folders)

- LibreChat `messagesTree` fork selection
- Claude / LibreChat / Doubao attachment honesty
- Spec signature-semantics rewrite (P2 — mention only if wire text must change for budgets)
- `--expect-key` authenticity pinning
- Streaming pack / NDJSON `data.json`
- npm publish

## Cursor

| Layer | Invoke |
|-------|--------|
| Repo | `@grove-port-implementation` |
| This folder | `@p0-hardening` → [`.agents/skills/p0-hardening/SKILL.md`](./.agents/skills/p0-hardening/SKILL.md) |

## Approval

Approved 2026-07-22 — Phase E unlocked.
