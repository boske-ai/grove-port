# Plan: Grove Vault

**Draft:** 2026-06-19

---

## Goal

Ship local secret broker with **opaque handles** — agent runs commands that need keys, never sees plaintext. See [`opaque-handles.md`](./opaque-handles.md).

---

## Phase 1 — Opaque handles (core)

| Task | Output |
|------|--------|
| Keychain/file backend | Store named secrets (human sets via CLI only) |
| Handle namespace | `vault://namespace/name` + optional `vlt_*` alias |
| `{{vault:name}}` substitution | Resolve at MCP server **spawn** / HTTP **edge** |
| CLI `grove-vault set/list/rotate/test` | `list` shows names never values |
| `grove-run --env <handle> -- <cmd>` | Child process env injection; parent/agent isolated |

**Security test:** fixture transcript after 100 tool calls — zero `ghp_`, `sk-`, raw bearer tokens.

---

## Phase 2 — MCP integration

| Task | Output |
|------|--------|
| stdio MCP shim | Wrap server; inject env from handles in yaml |
| Boske desktop spike | Vault picker in MCP settings → saves handle not secret |
| Redaction | Strip accidental secrets from logs; allow `vault://` |

---

## Phase 3 — Guard integration

| Task | Output |
|------|--------|
| Policy: allow `vault://github/*`, deny raw tokens in args | Guard + Vault doc |
| Audit: `resolve <handle>` without logging value | JSONL event type |

---

## What we explicitly do NOT build

| Anti-pattern | Why |
|--------------|-----|
| Encrypt secret for agent to decrypt | Agent has context → can decrypt |
| Fake `ghp_xxx` placeholders | Agent may exfiltrate |
| User pastes key into agent chat | Vault CLI only for set/rotate |

---

## Done criteria

- [ ] Opaque handle spec in `spec/handles-v1.md`
- [ ] Agent transcript never contains raw secret (automated test)
- [ ] `grove-run` child isolation test
- [ ] Rotate secret without MCP config change
- [ ] MIT LICENSE + threat model ([`opaque-handles.md`](./opaque-handles.md))

---

## Build order

**P1 among MCP projects** — your use case (run command with secret agent doesn’t know) is the flagship story. Ship before or parallel with Guard; Guard adds policy on which handles resolve.
