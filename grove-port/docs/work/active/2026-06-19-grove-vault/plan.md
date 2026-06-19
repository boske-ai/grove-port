# Plan: Grove Vault

**Active focus:** 2026-06-19  
**Goal:** Native secret safe in Boske (Mac + Linux) — agent uses keys, never sees them.

---

## Phase 0 — Spec (week 1)

| Task | Output |
|------|--------|
| Write `spec/handles-v1.md` | Handle format, substitution rules, threat model |
| Document `vault://` vs `{{vault:name}}` | Wire + config conventions |
| Security test fixtures | Transcript samples that must pass/fail |

---

## Phase 1 — Library `packages/vault` (MIT)

| Task | Output |
|------|--------|
| `VaultBackend` interface | set, list, resolve, delete, rotate |
| `KeychainBackend` (macOS) | Security framework / Keychain |
| `SecretServiceBackend` (Linux) | libsecret when available |
| `EncryptedFileBackend` (Linux fallback) | age or libsodium + user passphrase |
| Unit tests | list never returns values; resolve only from broker path |

**Extract from Boske:** Enterprise MCP credential injection patterns (shapes only).

---

## Phase 2 — CLI `grove-vault`

```bash
grove-vault set github --stdin          # hidden input
grove-vault set server/prod --file ~/.ssh/id_ed25519
grove-vault list                        # names only
grove-vault test github                 # "ok" or error, never value
grove-vault rotate github --stdin
grove-vault delete github
```

| Task | Output |
|------|--------|
| CLI commands above | Published npm/bun package |
| Exit codes | 0 ok, 1 not found, 2 permission denied |
| MIT LICENSE | Community repo `boske-ai/grove-vault` (private until MVP) |

---

## Phase 3 — Runtime injection

| Task | Output |
|------|--------|
| `grove-run --vault <handle> -- <cmd>` | Child env injection; agent/parent isolated |
| MCP spawn shim | Replace `{{vault:name}}` in env at child spawn only |
| Audit log (local JSONL) | `resolve github` — never value |
| Leak redaction (basic) | Strip `ghp_`, `sk-`, `BEGIN OPENSSH` from child stdout to agent |

**Not in Phase 3:** Full HTTP brokered requests (Hermetic-style) — defer to Phase 5.

---

## Phase 4 — Boske desktop integration

| Task | Output | Owner |
|------|--------|-------|
| Settings → Vault page | Add / list / delete secrets | Boske monorepo |
| MCP server config UI | Dropdown: pick vault handle | Boske monorepo |
| Import `packages/vault` | Same library as CLI | Boske monorepo |
| Dogfood | GitHub MCP via `{{vault:github}}` | Boske team |

---

## Phase 5 — SSH server management (your use case)

| Task | Output |
|------|--------|
| Store SSH private key in Vault | `grove-vault set server/prod --file` |
| `grove-run --vault server/prod -- ssh user@host <cmd>` | Works on Mac + Linux |
| Optional MCP tool `server_exec` | host + command template → output only |
| Command allowlist (minimal) | v1: document recommended patterns; full Guard later |

Inspired by Aegis SSH profiles — **not** full shell access.

---

## Phase 6 — Brokered HTTP (v1.1, optional)

| Task | Output |
|------|--------|
| MCP tool `vault_request` | URL + handle → HTTP response only |
| Domain binding per secret | `openai` handle only works on `api.openai.com` |

Hermetic parity — after SSH + MCP env prove the model.

---

## Deferred (not Vault v1)

| Item | When |
|------|------|
| Grove Guard full policy gateway | After Vault in Boske |
| Intent capabilities `cap://` | v2 |
| Windows backend | After Mac + Linux |
| Enterprise org vault sync | Boske Enterprise |
| Cloud broker (secr-style) | Never — local-first |

---

## Done criteria (Vault v1 ship)

- [ ] `spec/handles-v1.md` published
- [ ] Mac: save + list + resolve via Keychain
- [ ] Linux: save + list + resolve via libsecret or encrypted file
- [ ] `grove-vault list` never prints values (automated test)
- [ ] MCP child gets resolved env; exported config keeps `{{vault:x}}`
- [ ] `grove-run --vault` SSH smoke test on prod-like host
- [ ] Boske Settings → Vault UI (minimal)
- [ ] Transcript fixture: 100 turns, zero plaintext secrets
- [ ] MIT LICENSE on all Community packages

---

## Repo layout (target)

```
grove-vault/                    # new repo or boske-community/grove-vault/
├── spec/handles-v1.md
├── packages/vault/             # @grove/vault
├── packages/cli/               # grove-vault, grove-run
└── docs/
```

Boske desktop: `import { VaultBackend } from '@grove/vault'`

---

## Competitive positioning (ship message)

> Claude and ChatGPT ask before tools run. **Boske Vault** ensures the agent never sees your SSH key or API token — native on Mac and Linux, offline, MIT.

Not: "first MCP vault ever."  
Yes: "first integrated local-first workspace vault."
