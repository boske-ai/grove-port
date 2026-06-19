# Grove Vault — focus track

**Status:** **active focus** — primary Grove project after Port/Fit (parallel)  
**Started:** 2026-06-19

---

## One sentence

**Keys the agent can use but never know** — built into Boske on Mac and Linux.

---

## Why Vault (not Guard) first

| | Vault | Guard |
|--|-------|-------|
| Claude / ChatGPT already do it? | **Weak** — env vars, not true isolation | **Strong** — approvals, allow/deny |
| OSS crowded? | Crowded but **no MIT native Boske integration** | Very crowded (MCPShield, MCPGate) |
| Your SSH / server use case? | **Direct fit** | Secondary |
| Boske differentiation? | **High** — safe inside the app | Medium — reuse OSS gateway later |

→ [`../../ecosystem/competitive-reality-check.md`](../../ecosystem/competitive-reality-check.md)

---

## What we build

```
┌─────────────────────────────────────┐
│  Boske desktop (Mac + Linux)        │
│  Settings → Vault                   │
│  MCP config: {{vault:github}}       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  grove-vault (MIT library + CLI)      │
│  Mac: Keychain                        │
│  Linux: libsecret / encrypted file    │
└──────────────┬──────────────────────┘
               │ inject at edge only
┌──────────────▼──────────────────────┐
│  Agent / LLM                         │
│  sees: vault://server-prod only      │
└─────────────────────────────────────┘
```

**Not building:** standalone MCP vault server users install manually (agentic-vault, mcpvault already exist).  
**Building:** native Boske integration + MIT `grove-vault` library others can embed.

---

## v1 scope (MVP)

| In v1 | Out of v1 |
|-------|-----------|
| Save/list/rotate secrets (human only) | Grove Guard policy layer |
| `vault://name` handles | Cloud vault sync |
| `{{vault:name}}` in MCP spawn | Windows |
| `grove-run --env` for CLI | Intent capabilities (`cap://`) — v2 |
| Mac Keychain + Linux backends | Team org vault (Enterprise) |
| SSH key storage + wrapped `ssh` command | Full brokered HTTP MCP tool — v1.1 |
| Boske Settings → Vault UI | |

---

## Real problems v1 solves

1. **SSH server checks** — agent runs `systemctl status nginx`, never sees private key  
2. **No `ghp_` in chat** — GitHub token in Vault, agent sees `vault://github`  
3. **No plaintext `.env` for MCP** — config shows handles only  
4. **Rotate once** — update Vault, configs unchanged  
5. **Offline Boske Local** — secrets stay on machine  

---

## Docs in this folder

| File | Purpose |
|------|---------|
| [`plain.md`](./plain.md) | Simple English |
| [`native-platforms.md`](./native-platforms.md) | Mac Keychain + Linux |
| [`opaque-handles.md`](./opaque-handles.md) | Technical spec |
| [`plan.md`](./plan.md) | Phased build plan |
| [`../../ecosystem/vault-and-guard-plain.md`](../../ecosystem/vault-and-guard-plain.md) | Vault + Guard (Guard deferred) |
| [`../../ecosystem/competitive-reality-check.md`](../../ecosystem/competitive-reality-check.md) | Why Vault not Guard first |
| [`../../ecosystem/agent-credential-landscape.md`](../../ecosystem/agent-credential-landscape.md) | Hermetic, Wardgate, etc. |

---

## Build phases (summary)

| Phase | Deliverable | Owner |
|-------|-------------|-------|
| **0** | `spec/handles-v1.md` + handle wire format | Community repo |
| **1** | `packages/vault` — Keychain + Linux backend | Community repo |
| **2** | `grove-vault` CLI — set/list/rotate/test | Community repo |
| **3** | `grove-run --env` + MCP `{{vault}}` substitution | Community repo |
| **4** | Boske desktop — Settings → Vault + MCP picker | Boske monorepo |
| **5** | SSH profile: store key + `server_exec` MCP tool | Boske + Community |

---

## Success = you can do this

```bash
# Once (you, not the agent)
grove-vault set server/prod --file ~/.ssh/id_ed25519

# Agent config (safe to show model)
# identity: {{vault:server/prod}}

# Agent asks: "check nginx on prod"
grove-run --vault server/prod -- ssh deploy@prod "systemctl status nginx"

# Agent sees output only. Transcript shows vault://server/prod.
```

---

## Guard (later)

Vault v1 includes **minimal** safety without full Guard:

- Human-only `grove-vault set` (never via agent chat)
- `list` never prints values
- Log `resolve <handle>` not value
- Optional: block raw `ghp_` / `sk-` in MCP args (thin rule, not full Guard)

Full Grove Guard → after Vault ships in Boske.

---

## Links

- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md)
- Boske extract map: [`../../ecosystem/boske-extracts.md`](../../ecosystem/boske-extracts.md)
