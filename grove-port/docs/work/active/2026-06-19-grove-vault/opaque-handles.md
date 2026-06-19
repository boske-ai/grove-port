# Grove Vault — opaque handles (technical spec)

**Feature:** Let an agent run commands that need secrets **without ever seeing the real key** — and without the human pasting it into chat or config.

**Status:** Draft — core Grove Vault v1 capability  
**Related:** [`README.md`](./README.md) · [`plan.md`](./plan.md)

---

## The problem (your scenario)

You want the agent to run something like:

```bash
curl -H "Authorization: Bearer ???" https://api.example.com/deploy
# or
export GITHUB_TOKEN=??? && gh pr merge 42
```

But:

| Who | Should NOT |
|-----|------------|
| **You** | Paste the real key into the agent chat or a visible `.env` |
| **The agent** | See the real key in context, memory, or tool output |
| **Logs / transcripts** | Contain plaintext secrets |

Yet the **command must still work** when it actually runs.

---

## Is it technically possible?

**Yes.** This is a solved pattern in DevOps (Vault, Doppler, 1Password CLI, GitHub Actions secrets). The Grove version is **local-first** and **agent-aware**.

### What works (recommended)

**Opaque handles + injection at the execution boundary.**

The agent never gets the secret — it gets a **meaningless reference** that only Grove Vault can resolve on localhost:

```
Real secret:     ghp_xxxxxxxxxxxxxxxxxxxx   (in Keychain / encrypted store)
Agent sees:      vault://github/repo-read   (or vlt_7kQ2m9)
Runtime injects: real value only inside Vault proxy / child process
```

The handle is **not** “the key encrypted so the agent can decrypt it.”  
The agent has **no decryption key** and **no API** to read the plaintext. Resolution happens in a separate process you control.

### What does NOT work (avoid)

| Approach | Why bad |
|----------|---------|
| Encrypt key, give agent ciphertext + password | Agent can decrypt if it has both |
| Fake key like `ghp_FAKE_FOR_AGENT` | Agent may exfiltrate it; breaks if substituted wrong |
| “Obfuscate” with base64 / XOR | Trivially reversible in context |
| Trust the model to “forget” the key | Not a security boundary |

**Rule:** Security = **the secret never enters the agent’s context**. Not hiding it inside the context.

---

## Architecture

```
┌─────────────┐     vault://github      ┌──────────────┐     real token    ┌─────────┐
│   Agent     │ ──────────────────────► │ Grove Vault  │ ────────────────► │ GitHub  │
│  (LLM)      │   opaque handle only    │  (local)     │  at wire edge     │   API   │
└─────────────┘                         └──────────────┘                   └─────────┘
       │                                        │
       │ never sees ghp_…                       │ Keychain / file vault
       ▼                                        ▼
  transcript:                           audit: "resolve github/repo-read"
  Authorization: {{vault:github}}
```

### Three injection modes (v1 → v2)

| Mode | Agent writes | Vault does | Example |
|------|--------------|------------|---------|
| **A. MCP proxy** | Tool arg `token: "vault://github"` | Injects `Authorization` header on HTTP MCP call | GitHub MCP, deploy webhook |
| **B. Env subprocess** | `grove-run --env github npm publish` | Spawns child with `GITHUB_TOKEN` set; parent/agent never reads env | Shell commands |
| **C. Template in config** | `Bearer {{vault:openai}}` in MCP server yaml | Substitute before connection; agent file shows template only | Static MCP configs |

All three share the same **handle namespace** and audit log.

---

## Handle format

```text
vault://<namespace>/<name>           # stable, human-readable
vlt_<random>                        # opaque id (optional alias)
```

Examples:

```yaml
# mcp-servers.yaml — safe to commit, safe to show agent
github:
  command: npx
  args: ["-y", "@modelcontextprotocol/server-github"]
  env:
    GITHUB_PERSONAL_ACCESS_TOKEN: "{{vault:github/repo-read}}"
```

Agent reads yaml → sees `{{vault:github/repo-read}}` only.  
Vault MCP shim starts server → substitutes real token from Keychain → child process has real env; agent process does not.

---

## Real-life flows

### 1. “Deploy to staging without pasting the API key”

1. Ops: `grove-vault set deploy/staging --stdin` (paste once, terminal hidden)
2. Agent tool config: `curl -H "X-Deploy-Key: {{vault:deploy/staging}}" …`
3. Agent plans and invokes tool → Vault resolves at call time
4. Transcript shows handle; audit log shows `resolve deploy/staging` — not value

### 2. “Run `gh` for me but I don’t want Claude to know my PAT”

```bash
grove-run --env github/repo-read -- gh pr list
```

Agent suggests the command with handle; user approves; `grove-run` spawns `gh` with real `GITHUB_TOKEN` in **child** env only.

### 3. “Team member runs agent, never sees prod keys”

Admin stores `vault://db/prod` in Vault. Developer’s agent uses handle; developer never had plaintext access. Rotation = admin updates Vault only.

### 4. “Wrong key in the model’s head”

Agent **believes** the token is `vault://github/repo-read` (or a useless `vlt_abc`).  
If the model hallucinates `ghp_xxxx`, Guard/Vault rejects — only registered handles resolve.

---

## Security properties (v1)

| Property | v1 | v2 (optional) |
|----------|----|----------------|
| Agent context free of plaintext | ✓ | ✓ |
| User can avoid re-pasting keys | ✓ | ✓ |
| Handle useless without local Vault | ✓ | ✓ |
| Session-scoped ephemeral handles | | ✓ |
| Per-agent handle allowlist (Guard) | | ✓ |
| Auto-revoke after N uses | | ✓ |

**Threat model (honest):** Stops casual leakage via prompts, logs, and memory. Does **not** stop a malicious agent on the same machine from **requesting** Vault to resolve a handle — that’s why **Grove Guard** pairs next (policy: which handles/tools per session).

---

## Storage

| Layer | v1 |
|-------|-----|
| macOS | Keychain (`grove-vault` service) |
| Linux | `~/.config/grove-vault/secrets` encrypted with machine key (age or libsodium) |
| Never | Plaintext in repo, agent memory, or Boske cloud without E2E design |

User sets secret once via CLI — not via agent chat.

---

## CLI (draft)

```bash
# One-time setup (human only, hidden input)
grove-vault set github/repo-read --stdin

# List handles (names only, never values)
grove-vault list

# Run command with injected env
grove-run --env github/repo-read -- gh pr merge 42

# Test resolution (prints "ok", not secret)
grove-vault test github/repo-read

# Rotate
grove-vault rotate github/repo-read --stdin
```

---

## Boske integration

| Surface | Behavior |
|---------|----------|
| Boske desktop MCP settings | Pick secret from Vault dropdown → stores handle in config |
| Agent transcript | Redact any accidental `ghp_`, `sk-` patterns; allow `vault://` |
| Enterprise | Org vault sync + handle registry (paid) |

Cherry-pick from Enterprise MCP credential injection in Boske monorepo.

---

## v1 done criteria (opaque handles)

- [ ] Agent transcript fixture: no plaintext after 100 tool calls
- [ ] `{{vault:name}}` substitution in MCP env at process spawn
- [ ] `grove-run --env` child isolation test
- [ ] `grove-vault list` never prints values
- [ ] Threat model doc in repo

---

## Naming in the Grove family

This feature is **Grove Vault** — not a separate product. Marketing line:

> **Keys the agent can use but never know.**

Optional sub-feature name for docs: **opaque handles** or **Vault Mask** (internal only).

---

*Cross-ref: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) · Grove Guard (policy on handles)*
