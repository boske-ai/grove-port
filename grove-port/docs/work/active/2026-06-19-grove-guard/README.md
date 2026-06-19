# Grove Guard — MCP policy gateway

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

A **local-first security gate** between AI agents and MCP tools — deny-by-default policies, credential isolation, immutable audit log.

```
Agent ──► Grove Guard ──► allowed tools only
              │
              ├── policy.yaml (read email yes, send email no)
              ├── credential isolation (see Grove Vault)
              └── immutable audit log
```

---

## The smart insight (Grove Port pattern)

**Grove Port** solved “data trapped in vendors” with export **files**.  
**Grove Guard** solves “agents trapped with god-mode tools” with a policy **file** in the middle — like a firewall, not a suggestion in the system prompt.

---

## Real-life use cases

### 1. “The agent emailed my draft to the client list”

Freelancer runs Claude + MCP email. Prompt ambiguity → `send_email` fires.  
**Guard:** `email-send: deny` in policy. Block logged. Agent gets clear error; human sends manually.

### 2. “Legal wants a log of what AI accessed”

EU agency, 12 seats. Boss asks for monthly AI tool audit for insurance.  
**Guard:** `grove-guard audit --since 30d` → JSONL export. No SaaS required for OSS path.

### 3. “We’ll adopt AI when email is read-only”

SMB IT blocks Copilot until MCP is constrained.  
**Guard:** Ship `examples/work-inbox-readonly/policy.yaml`. Boske Enterprise adds org console later.

### 4. Post–OpenClaw-class incident

Team heard about agent tool abuse; wants deny-by-default before connecting Notion + Slack MCP.  
**Guard:** Default deny; explicit allow per tool. Comparable to Lunar MCPX but for homelab + desktop.

→ Full scenarios: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Guard

---

## What already exists in Boske

| Asset | Status |
|-------|--------|
| Enterprise Work inbox MCP patterns | Cherry-pick deny rules + tool catalog |
| Audit event shapes | Inform JSONL schema |
| MCP stdio proxy process | **Net-new OSS** |

→ [`../../ecosystem/boske-extracts.md`](../../ecosystem/boske-extracts.md)

---

## Brand & license

- **Boske Community** (trust + plugins)
- OSS: MIT gateway + local audit viewer
- **Paid hook:** Boske Enterprise — org policy console, SIEM export, EU AI Act report templates

---

## Dependencies

- **Grove Vault** (optional v1) — credential isolation can ship before full Guard
- Boske MCP security patterns cherry-picked from product
- Grove Port in progress (no format dependency)

---

## Links

- Plan: [`plan.md`](./plan.md)
- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md)
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md)

---

## Out of scope (v1)

- Kubernetes operator / multi-tenant SaaS
- Cloud-hosted policy management (Enterprise product)
