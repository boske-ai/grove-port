# Agent credential landscape — research for Grove Vault

*Deep dive (2026-06-19): Hermetic, Wardgate, CapSeal, Aegis, Lunar MCPX, and peers — licenses, architecture, and what Grove Vault should become for Boske + LLM agents.*

Cross-ref: [`opaque-handles.md`](../work/active/2026-06-19-grove-vault/opaque-handles.md) · [`use-cases.md`](./use-cases.md)

---

## Executive summary

**Yes — your SSH + API key scenario is technically proven.** Multiple projects already ship it for AI agents. None are a perfect fit for Boske’s **MIT + local-first + EU + Grove family** story.

**Grove Vault opportunity:** Combine the best ideas into one **AI-native, LLM-first** local broker that pairs with **Grove Guard** (policy) and **Boske desktop** (UX) — broader than SSH-only tools, more open than Hermetic’s proprietary binary, simpler than Wardgate for self-hosters, more productized than academic CapSeal.

---

## Landscape map

```
                    Enterprise / K8s
                           │
         Lunar MCPX ───────┼─────── 12Port PAM (commercial)
         HashiCorp Vault   │
                           │
    Local-first ◄──────────┼──────────► Agent-isolated
                           │
         Wardgate ─────────┼─────── Hermetic
         AgentCordon       │        agentic-vault
         secure-vault-mcp   │
                           │
              Aegis SSH MCP (SSH-only, MIT)
                           │
              CapSeal (research blueprint, no OSS release)
                           │
                    Grove Vault (target)
```

---

## Project-by-project

### 1. Hermetic — closest to “agent never sees the key”

| | |
|--|--|
| **URL** | [github.com/hermetic-sys/hermetic](https://github.com/hermetic-sys/hermetic) |
| **Stars** | ~1 (early) |
| **License** | **Open core:** `hermetic-core` + `hermetic-transport` = **AGPL-3.0**. **Daemon/CLI binary = proprietary** (free tier + paid Pro) |
| **Stack** | Rust, Linux x86_64 only (v1) |
| **MCP** | Native MCP server + MCP proxy for other servers |

**What it does well (★★★ brokered tier):**

- Agent calls `hermetic_authenticated_request` → gets HTTP response only, **never the credential**
- MCP proxy injects tokens into GitHub/Slack MCP servers from vault — no plaintext in IDE config
- **SSH-agent protocol** — `SSH_AUTH_SOCK` points at Hermetic; signing inside daemon
- Domain binding per secret, SSRF blocking, leak scanning in MCP messages, tool-definition pinning
- Binary attestation (`SO_PEERCRED`) — rejects unknown processes on the socket

**Three tiers:**

| Tier | Model | Agent sees secret? |
|------|-------|-------------------|
| ★★★ Brokered | Daemon makes the HTTP call | **Never** |
| ★★ Transient | `hermetic run --secret X -- cmd` | Child only, then wiped |
| ★ Direct | `hermetic reveal` | Human terminal only — **not an agent tool** |

**Gaps for Boske:**

- Proprietary binary — not MIT Community OSS
- AGPL core — careful if forking
- Linux-only v1 — Boske desktop is macOS-heavy
- No Grove Guard / EU audit story

**Take for Grove Vault:** Brokered HTTP + MCP proxy + ssh-agent model + leak scanning + domain binding.

---

### 2. Wardgate — most complete “AI security gateway” OSS

| | |
|--|--|
| **URL** | [github.com/wardgate/wardgate](https://github.com/wardgate/wardgate) |
| **Stars** | ~133 |
| **License** | **AGPL-3.0** |
| **Stack** | Go, Docker, presets for Todoist/GitHub/SSH/IMAP/SMTP |

**What it does well:**

- **API gateway:** agent calls `https://wardgate.internal/todoist/...` — credentials injected, capabilities per preset (`delete_tasks: deny`)
- **SSH preset:** host pinning, `exec_commands: ask` (human approval every command)
- **Conclaves:** isolated remote exec — agent runs `wardgate-cli exec obsidian "rg ..."` with per-command policy
- **LLM-specific:** redacts OTPs, verification links, API keys in responses — **including SSE streams** (streaming LLM APIs)
- **Approval workflows:** `ask` before send email, delete, `git push`
- **wardgate-proxy:** transparent injection for agents that bring their own HTTP client
- **AI skill file** to teach agents how to use wardgate-cli

**Gaps for Boske:**

- AGPL — same fork caution
- Heavier deploy (gateway + conclaves) — not “10-minute homelab”
- Enterprise tone but self-hostable

**Take for Grove Vault:** Presets, capabilities yaml, `ask` approval, SSE redaction for Boske chat, conclave pattern for “run on server without shell”.

---

### 3. CapSeal — best *architecture paper* (you may have meant this, not “Capsule”)

| | |
|--|--|
| **URL** | [arxiv.org/abs/2604.16762](https://arxiv.org/abs/2604.16762) |
| **License** | **No OSS release** — academic paper + Rust prototype (not publicly licensed for product use) |
| **Stack** | Rust prototype, MCP adapter, JSON-RPC over Unix sockets |

**Core idea (use this language for Grove):**

> Don’t hand the model a key. Grant a **narrowly scoped, non-exportable action capability.**

**Mechanisms:**

1. **Session** → **capability request** (intent + scope) → **invocation** → **audit proof**
2. **HTTP capability:** method + host + path pinned; JSON body schema-validated before credential use
3. **SSH capability:** **broker-exec** — agent never gets ssh-agent socket; broker runs `systemctl status nginx` template on pinned host + known_hosts pin
4. Anti-replay: sequence numbers, nonces, session binding via `SO_PEERCRED`
5. Tamper-evident audit chain

**Gaps:** No shipping OSS. Design reference only.

**Take for Grove Vault:** Intent-scoped capabilities (`cap://deploy/staging/status-nginx`) not just `vault://key-name`. This is **more AI** than dumb handles.

---

### 4. Aegis SSH MCP — your server-management use case, MIT

| | |
|--|--|
| **URL** | [github.com/sparksbenjamin/Aegis-SSH-MCP](https://github.com/sparksbenjamin/Aegis-SSH-MCP) |
| **Stars** | ~0 (early) |
| **License** | **MIT** ✅ |
| **Stack** | Go, Docker, MCP over SSE/stdio |

**What it does well:**

- Agent gets **MCP tool per host** — no raw SSH shell
- **Rule profiles:** `docker-readonly`, `systemd-ops`, `kubernetes-readonly`, etc.
- Rejects chaining, redirects, command substitution **before** SSH connects
- Ephemeral SSH session per request; host key fingerprint pinning
- Key stays in container `keys/` — agent never sees it

**Gaps:**

- SSH only — no API tokens, no unified vault
- Keys on disk in container (operator secures `keys/`)
- No “brokered HTTP” tier

**Take for Grove Vault:** SSH rule profiles + command validation + MIT license as reference implementation for `grove-vault ssh exec prod "systemctl status nginx"`.

---

### 5. Lunar MCPX — enterprise MCP gateway

| | |
|--|--|
| **URL** | [github.com/TheLunarCompany/lunar/tree/main/mcpx](https://github.com/TheLunarCompany/lunar/tree/main/mcpx) |
| **Stars** | ~413 (lunar monorepo) |
| **License** | **MIT** (lunar repo) ✅ |
| **Stack** | TypeScript, Docker/K8s, enterprise tier |

**What it does well:**

- Aggregates many MCP servers behind one gateway
- Secret refs from HashiCorp Vault / AWS / GCP / Azure — user sees **reference name only**
- ACL per client, audit, control plane UI
- Enterprise: group-based access, DLP, rotation propagation

**Gaps:**

- Remote-first / K8s — not Boske self-hoster desktop sweet spot
- Enterprise features paid

**Take for Grove Vault:** “reference name not value” UX; optional external vault backend for Enterprise Boske (not v1).

---

### 6. Other peers (shorter)

| Project | License | Focus | Boske relevance |
|---------|---------|-------|-----------------|
| [AgentCordon](https://github.com/agentcordon/agentcordon) | AGPL (typical) | Cedar policies, broker + server, MCP gateway | Policy engine inspiration for Grove Guard |
| [agentic-vault / secretproxy](https://github.com/AliProgrammin/agentic-vault) | AGPL-3.0 | MCP `http_request` + `run_command` with injection | Very close to Vault v1 scope |
| [secure-vault-mcp](https://github.com/mdfifty50-boop/secure-vault-mcp) | Check repo | MCP `inject_secret_to_request`, scoped tokens | Token ID pattern = our opaque handles |
| [HashiCorp Vault SSH OTP](https://developer.hashicorp.com/vault/docs/secrets/ssh/one-time-ssh-passwords) | BSL / open core | One-time SSH password per login | Different model; good for Enterprise “break glass” |
| [12Port](https://www.12port.com/platform/ai/) | Commercial | PAM + MCP for privileged access | Enterprise positioning reference |

---

## License summary (can we use / fork / learn?)

| Project | License | Fork into Boske MIT? | Learn patterns? |
|---------|---------|----------------------|-----------------|
| Hermetic core | AGPL-3.0 | ⚠️ Copyleft — derivative must be AGPL | ✅ |
| Hermetic binary | Proprietary | ❌ | ✅ behavior spec |
| Wardgate | AGPL-3.0 | ⚠️ Same | ✅ |
| Aegis SSH MCP | **MIT** | ✅ | ✅ |
| Lunar MCPX | **MIT** | ✅ | ✅ |
| CapSeal | No public code license | ❌ | ✅ architecture only |
| AgentCordon / agentic-vault | AGPL | ⚠️ | ✅ |

**Boske Community strategy:** Implement Grove Vault **clean-room** (MIT), informed by patterns — don’t fork AGPL into MIT tree. Cite CapSeal/Wardgate/Hermetic in docs; ship our own daemon.

---

## Can we do it for LLMs / Boske? **Yes.**

| Requirement | Proven by |
|-------------|-----------|
| Agent runs SSH, never sees key | Hermetic ssh-agent, Aegis broker-exec, CapSeal SSH capability, Wardgate SSH preset |
| Agent calls API, never sees token | Hermetic brokered, Wardgate gateway, agentic-vault |
| Agent sees opaque reference only | secure-vault-mcp tokens, CapSeal capability handles, Lunar secret refs |
| MCP-native | Hermetic, Aegis, Wardgate, Lunar MCPX |
| Human approval for dangerous ops | Wardgate `ask`, CapSeal step-up |
| Redact secrets from LLM context | Wardgate SSE filtering, Hermetic leak scan |
| Local-first / no cloud | Hermetic, agentic-vault, Aegis (self-host Docker) |

---

## Grove Vault — broader, more AI-native vision

Combine patterns into **three layers** (fits Grove family):

```
┌─────────────────────────────────────────────────────────┐
│  Boske / Claude / Cursor (untrusted LLM + tools)        │
└───────────────────────────┬─────────────────────────────┘
                            │ MCP: capability requests only
┌───────────────────────────▼─────────────────────────────┐
│  Grove Guard (policy) — allow/deny/ask per tool/intent   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Grove Vault (secrets)                                   │
│  • Opaque handles: vault://github/repo-read              │
│  • AI capabilities: cap://prod/check-nginx               │
│  • Brokered HTTP / SSH / env subprocess                  │
│  • Leak scan + redact before text → LLM context           │
└───────────────────────────┬─────────────────────────────┘
                            │ real credentials
┌───────────────────────────▼─────────────────────────────┐
│  Keychain / encrypted store / optional Enterprise vault  │
└─────────────────────────────────────────────────────────┘
```

### Beyond competitors — “more AI” features for Boske

| Feature | What | Inspired by |
|---------|------|-------------|
| **Intent capabilities** | Agent requests `cap://prod/nginx-status`, not a raw key — broker maps to SSH template + credential | CapSeal |
| **Session-bound handles** | Handle expires when chat session ends — limits prompt-injection blast radius | CapSeal anti-replay |
| **MCP proxy mode** | Wrap existing MCP servers (GitHub, Boske tools) — inject env from vault | Hermetic |
| **SSH profiles** | `prod-readonly`, `prod-ops` rule packs | Aegis |
| **Ask before run** | Boske UI popup: “Agent wants `systemctl restart nginx` on prod — approve?” | Wardgate |
| **LLM output redaction** | Strip `sk-`, `ghp_`, OTP from tool results before they enter context | Wardgate |
| **Domain binding** | `openai` secret only works on `api.openai.com` — blocks exfil curl | Hermetic |
| **Tool rug-pull detection** | Hash MCP tool definitions; alert if server changes tools mid-session | Hermetic |
| **Grove Fit hook** | “This agent task needs Forest; you have Seed” — before running heavy local tools | Boske Labs |
| **EU audit export** | JSONL + AI Act template: who approved what capability when | Boske Enterprise |
| **Works offline** | Local LLM + local vault — no cloud secret manager required | Boske Local |

### Two execution modes (user chooses per secret)

| Mode | Agent experience | Best for |
|------|------------------|----------|
| **Brokered** (★★★) | “Check nginx on prod” → output only | APIs, untrusted models, cloud agents |
| **Wrapped command** (★★) | `grove-run --vault ssh/prod -- ssh …` | Git, rsync, familiar CLI |
| **Capability SSH** (★★★ AI) | MCP tool `server_exec(host=prod, template=status-nginx)` | Your server-management scenario |

**Your SSH example with capability mode:**

```
You (once):     grove-vault set ssh/prod --file ~/.ssh/id_ed25519
You (config):   cap prod-readonly → host prod, templates [systemctl *, df, docker ps]

Agent sees:     MCP tool server_exec(prod, "systemctl status nginx")
Agent never:    sees private key bytes
Vault does:     validate template → SSH with real key → return stdout only
Guard optional: ask before systemctl restart*
```

---

## Recommended build plan (informed by landscape)

| Phase | Ship | Borrow from |
|-------|------|-------------|
| **v0.1** | `grove-vault set/list` + Keychain + `{{vault:name}}` MCP env inject | agentic-vault, Hermetic proxy |
| **v0.2** | `grove-run --env` + MCP brokered HTTP tool | Hermetic ★★★ |
| **v0.3** | SSH capability templates + rule profiles | Aegis + CapSeal broker-exec |
| **v0.4** | Grove Guard integration (allow/deny/ask) | Wardgate + AgentCordon Cedar |
| **v0.5** | LLM redaction + leak scan on tool results | Wardgate + Hermetic |
| **v1** | Boske desktop vault picker + approval UI | Boske product |

**License:** MIT for all Grove Vault code. No AGPL dependency.

---

## Positioning vs Hermetic / Wardgate (honest)

| | Hermetic | Wardgate | **Grove Vault** |
|--|----------|----------|-----------------|
| License | Open core AGPL + proprietary binary | AGPL | **MIT** |
| Audience | Developers securing coding agents | Power users / homelab gateway | **Boske + EU self-host + MCP ecosystem** |
| macOS | ❌ v1 | ✅ Docker | **✅ target** |
| SSH | ssh-agent | preset + ask | **capability templates** |
| Policy | Per-tool in proxy | Rich yaml + conclaves | **Grove Guard sibling** |
| LLM redaction | Leak scan | SSE redaction | **Both — first-class for Boske chat** |
| Funnel | Standalone product | Standalone | **Grove Port → Boske → Enterprise** |

---

## Next doc / code steps

1. Merge capability model into [`opaque-handles.md`](../work/active/2026-06-19-grove-vault/opaque-handles.md) (v2)
2. Add `spec/capability-v1.md` for intent-scoped SSH/HTTP capabilities
3. Spike: MIT MCP server with `brokered_request` + `server_exec` tools (Aegis rules subset)
4. Boske monorepo: inventory Enterprise MCP injection for cherry-pick list

---

*Sources checked: project READMEs, LICENSE files, HashiCorp Vault SSH docs, CapSeal arXiv paper (Apr 2026), Lunar.dev MCPX docs, web search Mar–Jun 2026.*
