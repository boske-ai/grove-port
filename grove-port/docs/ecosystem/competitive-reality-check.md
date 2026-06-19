# Competitive reality check — Vault & Guard (2026)

*Honest look at what Claude, ChatGPT, Cursor, and OSS already ship — and where Boske still has room.*

Plain English: [`vault-and-guard-plain.md`](./vault-and-guard-plain.md)

---

## Short answer

| | Already exists? | Should Boske still build? |
|--|----------------|---------------------------|
| **Grove Guard** (tool bouncer) | **Yes — a lot** | Only if **Boske-native + EU + pairs with Vault** — not “another generic MCP firewall” |
| **Grove Vault** (secret safe) | **Yes — growing fast** | **Yes** — if **built into Boske desktop**, MIT, offline/local LLM — not a separate install |

**Claude and ChatGPT built the “ask before tool runs” layer (Guard-like).**  
**They did NOT fully solve “agent never sees your SSH/API keys” (Vault-like).**

---

## What Claude (Anthropic) already has — Guard-like

**Claude Code** (not the consumer chat app) ships serious controls:

| Feature | What it does |
|---------|--------------|
| `permissions.allow` / `deny` / `ask` | Block or require approval per tool |
| **Managed settings** | IT pushes rules; devs can't override |
| `allowManagedMcpServersOnly` | Only approved MCP servers |
| **Sandbox** | OS-level network + filesystem limits |
| `disableBypassPermissionsMode` | Can't skip safety prompts |

Docs: [Claude Code admin setup](https://code.claude.com/docs/en/admin-setup)

**Gap Claude leaves open:**

- Rules target **Claude's tools** — a allowed `Bash` tool can still `cat .env` ([Adversis analysis](https://www.adversis.io/blogs/securing-claude-code-for-teams))
- Locked to **Anthropic's agent** — not Boske, not Open WebUI, not your homelab stack
- Enterprise admin console — not a simple OSS `policy.yaml` for self-hosters
- **No Grove Vault** — keys still on disk in `~/.ssh`, `.env`, MCP config

**Consumer Claude chat** has lighter MCP controls than Claude Code.

---

## What ChatGPT / OpenAI already has

| Feature | What it does |
|---------|--------------|
| **Tool approval cards** | User must approve MCP tool calls (especially writes) |
| `require_approval` in API | Dev can force approval per tool or server |
| **Developer Mode / Apps** | Connect remote MCP over HTTPS |
| OAuth connectors | Google, etc. — tokens via OAuth, not pasted keys |
| **Codex CLI** | Per-MCP `env_vars`, sandbox, `requirements.toml` for enterprise |
| **Encrypted MCP OAuth** (2026) | OAuth tokens in system keyring — not plaintext in config |

Docs: [OpenAI MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) · [Codex MCP](https://developers.openai.com/codex/mcp)

**Gap OpenAI leaves open:**

- MCP subprocess still gets secrets via **environment variables** — agent can often trigger commands that read them
- **No brokered SSH** for server management
- **Cloud-centric** — Boske Local / EU on-prem is a different buyer
- Approval is **per vendor UX** — not portable OSS policy

---

## What Cursor / Copilot / others have

| Product | Secrets | Tool policy |
|---------|---------|-------------|
| **Cursor** | `${env:VAR}` in `mcp.json` — env vars, not a vault | Limited vs Claude Code |
| **Copilot** | GitHub/OAuth ecosystem | Enterprise policies |
| **Windsurf / etc.** | Similar MCP config patterns | Varies |

Many **third-party Vault MCP servers** exist for Cursor/Claude:

| Project | License | Model |
|---------|---------|-------|
| [agentic-vault](https://github.com/AliProgrammin/agentic-vault) | AGPL-3.0 | Local MCP server, inject on HTTP/command |
| [mcpvault](https://github.com/Elraian/mcpvault) | Check repo | Local encrypted vault, per-service wrappers |
| [Agent-Credential-Vault](https://github.com/MCPFence/Agent-Credential-Vault) | Check repo | Task-scoped, web console |
| [@secr/mcp](https://secr.dev/integrations/mcp) | SaaS | Cloud broker, allowlist, audit |
| [Hermetic](https://github.com/hermetic-sys/hermetic) | AGPL core + **proprietary binary** | Best brokered tier |

---

## OSS “Grove Guard” competitors (already shipped)

These are **exactly** deny-by-default MCP gateways with audit logs:

| Project | License | Stars (approx) | Notes |
|---------|---------|----------------|-------|
| [MCPShield](https://github.com/haze518/mcpshield) | **MIT** | Early | YAML policy, hash-chain audit, deny-default |
| [MCPGate](https://github.com/maksym-mishchenko/mcpgate) | **MIT** | Early | ASK mode, approval UI, injection scanner |
| [AgentGuard MCP](https://github.com/Blackfrost-AI/agentguard-mcp) | Check repo | Early | Federal/NIST mapping, signed audit |
| [MCP Visor](https://github.com/themayursinha/mcp-visor) | Check repo | Early | Chain detection, approval, redaction |
| [Wardgate](https://github.com/wardgate/wardgate) | **AGPL-3.0** | ~133 | API + SSH + conclaves, SSE redaction |
| [Lunar MCPX](https://github.com/TheLunarCompany/lunar/tree/main/mcpx) | **MIT** | ~400+ repo | Enterprise gateway, K8s |
| [Bifrost](https://github.com/maximhq/bifrost) | Check repo | Enterprise MCP governance |

**Honest take:** Another standalone “MCP firewall” repo is **not novel**. MCPShield and MCPGate are MIT and overlap heavily with Grove Guard v1.

---

## OSS “Grove Vault” competitors

| Project | License | Brokered (agent never sees key)? |
|---------|---------|----------------------------------|
| Hermetic | AGPL + proprietary binary | **Yes** ★★★ |
| Wardgate | AGPL | **Yes** |
| agentic-vault | AGPL | **Yes** |
| mcpvault | OSS | **Yes** (wrappers) |
| secure-vault-mcp | OSS | Partial (token IDs) |
| OpenAI Codex | Proprietary | OAuth in keyring only |

---

## So are we reinventing the wheel?

### Grove Guard — **partly yes**

Claude Code + ChatGPT + MCPShield + MCPGate already cover:

- Allow / deny / ask before tools run  
- MCP server allowlists  
- Audit logs  
- Prompt-injection-aware gateways  

**Don't build:** “Yet another generic MCP proxy” with the same README as MCPShield.

**Do build (Boske-specific Guard):**

1. **Inside Boske** — not a separate daemon users must discover  
2. **Works with any model** — local LLM, not Claude-only managed settings  
3. **EU / self-host story** — simple `policy.yaml`, no K8s  
4. **Vault integration** — policy on `vault://` handles + block raw `ghp_` in args  
5. **Grove family** — same brand as Port (trust), Fit, etc.  
6. **Boske Enterprise** — org console, EU audit export (paid layer)

Think: **Guard as Boske's bouncer**, not "we invented MCP firewalls."

---

### Grove Vault — **still worth it, different angle**

Big vendors focused on **approval**, not **credential isolation**:

- OpenAI forwards `env_vars` to MCP children  
- Claude warns about `.env` but Bash can still read files  
- Cursor wants `${env:VAR}`  

**Don't build:** Another standalone MCP server named `grove-vault-mcp` that users install manually (crowded).

**Do build:**

1. **Native in Boske desktop** (Mac Keychain + Linux keyring) — see [native-platforms.md](../work/active/2026-06-19-grove-vault/native-platforms.md)  
2. **MIT full stack** — vs Hermetic proprietary binary, vs AGPL forks  
3. **Offline + Boske Local** — no secr.cloud account  
4. **SSH server story** — self-hosters (your use case)  
5. **Vault + Guard + Port** — one EU private workspace narrative  
6. **Intent capabilities** (CapSeal-style) — agent requests actions, not keys  

Think: **Vault as Boske's safe**, not "we invented secret managers."

---

## Matrix: who solves what?

| Problem | ChatGPT | Claude Code | MCPShield | Hermetic | **Boske target** |
|---------|---------|-------------|-----------|----------|------------------|
| Approve tool calls | ✅ UI | ✅ allow/ask/deny | ✅ | partial | Guard in Boske |
| Hide API keys from agent | ❌ partial | ❌ partial | ❌ | ✅ | **Vault native** |
| Hide SSH keys | ❌ | ❌ | ❌ | ✅ | **Vault native** |
| Local LLM / offline | ❌ | ❌ | ✅ | ✅ Linux | **Boske Local** |
| EU self-host / no cloud | ❌ | ❌ | ✅ | ✅ | **Core story** |
| Portable workspace (Port) | ❌ | ❌ | ❌ | ❌ | **Grove Port** |
| MIT Community OSS | ❌ | ❌ | ✅ | partial | **Yes** |
| One integrated app | ❌ | ❌ | ❌ | ❌ | **Boske desktop** |

---

## Recommended strategy (updated)

### Grove Vault — **build** (differentiated)

- Ship **inside Boske** first  
- Reuse ideas from Hermetic/agentic-vault, **don't fork AGPL**  
- Lead marketing: *"Keys the agent can use but never know"* + SSH server management  

### Grove Guard — **narrow scope** or **merge**

Options:

| Option | Pros | Cons |
|--------|------|------|
| **A. Build thin Boske wrapper** around MIT MCPShield/MCPGate | Fast, honest | Less glory |
| **B. Build Boske-only policy layer** (email/files/SSH profiles) | Unique to Boske MCP routes | Some overlap |
| **C. Document Guard as "use Claude Code policies if on Claude"** | Honest | Weak OSS story |

**Recommendation:** **B** — Guard rules tuned for Boske + Vault handles + EU audit, but **reuse** MIT gateway code where possible instead of rewriting MCPShield from scratch.

### What to stop claiming

- ❌ "First MCP security gateway"  
- ❌ "Nobody does agent credential isolation"  
- ✅ "First **integrated** EU local-first workspace with Port + Vault + Guard"  
- ✅ "MIT native vault in the desktop app for self-hosters and local LLMs"  

---

## Sources (checked June 2026)

- [Claude Code managed settings](https://code.claude.com/docs/en/admin-setup)  
- [OpenAI MCP + approvals](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)  
- [OpenAI Codex MCP config](https://developers.openai.com/codex/mcp)  
- [Adversis — Claude Code teams](https://www.adversis.io/blogs/securing-claude-code-for-teams)  
- [MCPShield](https://github.com/haze518/mcpshield) (MIT)  
- [MCPGate](https://github.com/maksym-mishchenko/mcpgate) (MIT)  
- [Wardgate](https://github.com/wardgate/wardgate) (AGPL)  
- [Hermetic](https://github.com/hermetic-sys/hermetic) (AGPL + proprietary)  
- [agentic-vault](https://github.com/AliProgrammin/agentic-vault) (AGPL)  
- [CapSeal paper](https://arxiv.org/abs/2604.16762) (architecture)  
- Prior: [`agent-credential-landscape.md`](./agent-credential-landscape.md)

---

*Update when shipping; re-check Claude/OpenAI docs each quarter.*
