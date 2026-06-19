# Plan: Grove Guard

**Draft:** 2026-06-19

---

## Goal

Ship a credible **v1 MCP policy gateway** that self-hosters can run locally without Boske Enterprise.

---

## Phase 1 — Core gateway

| Task | Output |
|------|--------|
| Define `policy.yaml` schema | Tool allow/deny, rate limits, credential scopes |
| Proxy MCP stdio/SSE | Agent connects to Guard; Guard connects to real servers |
| Deny-by-default | Unlisted tools blocked with clear error |
| Structured audit log | JSONL: timestamp, tool, args hash, allow/deny, agent id |

```yaml
# policy.yaml (draft)
version: 1
default: deny
tools:
  filesystem-read:
    allow: true
    paths: ["~/Documents"]
  email-send:
    allow: false
```

---

## Phase 2 — Local operator UX

| Task | Output |
|------|--------|
| CLI `grove-guard start --policy policy.yaml` | Runs gateway |
| CLI `grove-guard audit --tail` | Human-readable audit viewer |
| Boske desktop integration spike | Route MCP through Guard socket |

---

## Phase 3 — Enterprise hooks (spec only in OSS)

| Task | Output |
|------|--------|
| Document SIEM export format | Syslog / JSON stream spec |
| Document org policy merge | Multiple policy files + precedence |
| EU AI Act report template | Markdown template in docs (not legal advice) |

---

## Repo layout (planned)

```
boske-community/grove-guard/
├── packages/gateway/
├── packages/cli/
├── spec/policy-v1.md
└── examples/work-inbox-mcp/
```

GitHub: `boske-ai/grove-guard` (private until MVP)

---

## Done criteria

- [ ] Agent cannot call a tool not in policy (integration test)
- [ ] Audit log is append-only and survives restart
- [ ] README: 5-minute self-host quickstart
- [ ] MIT LICENSE

---

## Risks

| Risk | Mitigation |
|------|------------|
| MCP transport fragmentation (stdio vs SSE) | v1: stdio only; SSE in P2 |
| Policy bypass via direct server connection | Document “Guard is the only MCP entrypoint” pattern |
| Scope creep into Enterprise console | OSS = gateway + audit; console stays proprietary |

---

## Build order vs siblings

**Start here** among remaining Grove projects — highest GitHub star potential and strongest Enterprise funnel after Port.
