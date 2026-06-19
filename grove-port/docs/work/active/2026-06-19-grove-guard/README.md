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
              ├── credential isolation
              └── immutable audit log
```

---

## Why

| Audience | Pain | Guard fix |
|----------|------|-----------|
| Self-hosters | Agents run with full MCP access, no policy layer | Local gateway + policy file |
| SMB / EU teams | Shadow IT fear after OpenClaw-class incidents | Audit log + deny-by-default |
| Boske Enterprise | Need org tool catalog + compliance | Paid policy console + SIEM export |

**Comparable:** Lunar MCPX, Microsoft Agent Governance Toolkit — mostly enterprise/K8s. Grove Guard targets **SMB + self-host + Boske desktop**.

---

## Brand & license

- **Boske Community** (trust + plugins)
- OSS: MIT gateway + local audit viewer
- **Paid hook:** Boske Enterprise — org policy console, SIEM export, EU AI Act report templates

---

## Dependencies

- Boske MCP security patterns cherry-picked from product (Enterprise “Work inbox MCP” pre-wired)
- Grove Port v1 in progress (context only — no format dependency)

---

## Links

- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md) § Grove Guard
- Architecture: [`../../architecture/three-layers.md`](../../architecture/three-layers.md)

---

## Out of scope (v1)

- Kubernetes operator / multi-tenant SaaS
- Cloud-hosted policy management (Enterprise product)
