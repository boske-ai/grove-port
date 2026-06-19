# Plan: Grove Pack spec

**Draft:** 2026-06-19

---

## Goal

Publish a **minimal, validatable pack manifest** so community and Boske Labs can share the same wire format.

---

## Phase 1 — Spec

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Stable slug |
| `version` | yes | Semver |
| `tierMinimum` | yes | `seed` \| `sapling` \| `local` \| `forest` |
| `requiresNetwork` | yes | Boolean |
| `systemPrompt` | yes | Multiline string |
| `tools` | no | Allowed MCP/tool ids |
| `metadata` | no | Author, license, tags |

Write `spec/v1/README.md` + JSON Schema.

---

## Phase 2 — Validator CLI

```bash
grove-pack validate ./writing-coach/pack.yaml
grove-pack inspect ./writing-coach/   # summary for humans
```

- Pure Node/Bun; Zod + JSON Schema emit (same pattern as Grove Port schema package)
- Exit non-zero on validation failure

---

## Phase 3 — Boske handshake

| Task | Owner |
|------|-------|
| Map pack.yaml → Boske Labs loader | Boske monorepo |
| Document import path in Boske Settings | Boske monorepo |
| One example community pack in repo | This repo |

---

## Repo layout (planned)

```
boske-labs/grove-pack/
├── spec/v1/
├── packages/schema/
├── packages/cli/
└── examples/writing-coach/
```

GitHub: `boske-ai/grove-pack`

---

## Done criteria

- [ ] Spec published with at least one example pack
- [ ] `grove-pack validate` passes on example
- [ ] Boske Labs team confirms field mapping
- [ ] MIT LICENSE

---

## Risks

| Risk | Mitigation |
|------|------------|
| Over-specifying before Labs packs ship | Sync weekly with skills-labs-v1 owner |
| Confusion with proprietary pack content | README “format vs catalog” callout |

---

## Build order vs siblings

**Second** — lowest build cost, unblocks Labs packs marketing. Can run in parallel with Guard if different owners.
