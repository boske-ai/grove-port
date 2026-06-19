# Plan: Grove Vault

**Draft:** 2026-06-19

---

## Goal

Ship local secret broker with `vault://` MCP URI scheme — keys out of agent context.

---

## Phase 1 — Core

| Task | Output |
|------|--------|
| Keychain/file backend | Store named secrets |
| `vault://name` resolver | MCP shim injects header at connection time |
| CLI `grove-vault set/list/rotate` | Operator UX |

---

## Phase 2 — MCP integration

| Task | Output |
|------|--------|
| stdio proxy snippet | Example MCP server config |
| Boske desktop spike | Optional Vault socket in settings |

---

## Phase 3 — Guard integration

Document how Guard policy references Vault handles (`vault://github` allow, raw env deny).

---

## Done criteria

- [ ] Agent transcript never contains raw secret (test)
- [ ] Rotate secret without MCP config change
- [ ] MIT LICENSE + threat model

---

## Build order

**Before or parallel with Guard v1** — smaller surface, same audience. Reduces Guard scope creep.
