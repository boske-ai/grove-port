# Grove Vault — MCP credential broker

**Plain English:** [`plain.md`](./plain.md) · [`../../ecosystem/vault-and-guard-plain.md`](../../ecosystem/vault-and-guard-plain.md)  
**Native Mac + Linux:** [`native-platforms.md`](./native-platforms.md)

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Local credential broker so **agents never see raw API keys** — scoped MCP tokens per tool/session.

**Core feature: [opaque handles](./opaque-handles.md)** — the agent runs commands that need secrets, but only sees `vault://github` (or `{{vault:github}}`), never the real `ghp_…` key. You don't paste keys into chat. Vault injects the real value at execution time.

```
Agent sees:     vault://github/repo-read   (or vlt_7kQ2m9)
Vault stores:   real token in Keychain
Runtime:        inject at MCP proxy / child process edge
```

---

## The smart insight

Full MCP firewall (Guard) is a big ask. Most incidents start with **keys in config files and prompts**.  
Vault = the SSL of MCP — isolate secrets first; policy layer second.

**Your scenario:** "I want the agent to run the command, but neither of us should know the real key."  
→ **Technically yes** — via opaque handles, not encryption inside the agent context. See [`opaque-handles.md`](./opaque-handles.md).

---

## Real-life use cases

### 1. "Run deploy curl without pasting the API key"

Ops stores `vault://deploy/staging` once. Agent config uses `{{vault:deploy/staging}}`. Command works; transcript shows handle only.

### 2. "I won't paste my GitHub PAT into Claude"

`grove-run --env github/repo-read -- gh pr merge 42` — child process has token; agent never did.

### 3. "The agent should see a different kind of key"

Agent sees meaningless handle `vault://openai/prod` — not a fake `sk-…` it could leak. Wrong handles don't resolve.

### 4. Team key rotation

Admin rotates secret in Vault; agent configs unchanged.

### 5. Guard prerequisite

Enterprise: Guard allows `vault://github/*`; denies raw `ghp_` in tool args.

→ Full scenarios: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Vault

---

## What already exists in Boske

| Asset | Status |
|-------|--------|
| Enterprise MCP credential injection | Pattern to cherry-pick |
| Desktop Keychain usage | macOS reference |

→ [`../../ecosystem/boske-extracts.md`](../../ecosystem/boske-extracts.md)

---

## Brand & license

- **Boske Community**
- OSS: MIT local broker + CLI
- **Paid hook:** Org-wide rotation, audit (Enterprise)

---

## Links

- Plan: [`plan.md`](./plan.md)
- **Opaque handles (technical):** [`opaque-handles.md`](./opaque-handles.md)
- **Competitor research:** [`../../ecosystem/agent-credential-landscape.md`](../../ecosystem/agent-credential-landscape.md)
- Pairs with: Grove Guard
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md)

---

## Out of scope (v1)

- Cloud secrets manager
- Browser extension credential fill
- Agent-side decryptable encryption (anti-pattern)
