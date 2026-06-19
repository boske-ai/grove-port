# Grove Vault — MCP credential broker

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Local credential broker so **agents never see raw API keys** — scoped MCP tokens per tool/session.

```
Agent ──► vault://github (scoped) ──► Grove Vault ──► real token in Keychain
```

Grove Guard adds policy + audit on top; Vault ships **standalone** for faster adoption.

---

## The smart insight

Full MCP firewall (Guard) is a big ask. Most incidents start with **keys in config files and prompts**.  
Vault = the SSL of MCP — isolate secrets first; policy layer second.

---

## Real-life use cases

### 1. “I won’t paste my GitHub PAT into Claude”

User stores token in Vault with `repo:read` scope. MCP config uses `vault://github`. Agent never receives raw PAT.

### 2. Team key rotation

Admin rotates OpenAI key in Vault; agents unchanged — no YAML hunt across 8 machines.

### 3. Guard prerequisite

Enterprise deploys Vault → then Guard policy on which vault handles agents may call.

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
- Pairs with: Grove Guard
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Vault

---

## Out of scope (v1)

- Cloud secrets manager
- Browser extension credential fill
