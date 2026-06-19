# Plan: Grove Index

**Draft:** 2026-06-19

---

## Goal

Ship a **manifest spec + library** for tracking document/chunk freshness across any vector backend.

---

## Phase 1 — Manifest spec

```json
{
  "version": 1,
  "sources": [
    {
      "doc_id": "wiki/getting-started.md",
      "content_hash": "sha256:…",
      "chunk_ids": ["c1", "c2"],
      "embedded_at": "2026-06-01T12:00:00Z",
      "source_uri": "file:///…"
    }
  ]
}
```

| Operation | Behavior |
|-----------|----------|
| `diff` | Compare live file hashes vs manifest → stale list |
| `report` | Human summary: N docs, M stale, oldest embed |
| `plan` | Output ordered re-embed job list (ids only) |

---

## Phase 2 — Library

```typescript
import { IndexManifest, diffManifest } from "@grove-port/index";

const stale = diffManifest(manifest, liveHashes);
```

- No embedding — caller runs embed jobs
- Adapters: filesystem walker (v1), git tree (P2)

---

## Phase 3 — Boske integration (later)

| Task | Owner |
|------|-------|
| Export Sources state → Grove Index manifest | Boske monorepo |
| Scheduled stale check in Boske Cloud | Boske product |

---

## Repo layout (planned)

```
boske-community/grove-index/
├── spec/v1/
├── packages/index/
└── packages/cli/
```

---

## Done criteria

- [ ] Spec + JSON Schema
- [ ] `diff` integration test with fixture files
- [ ] CLI `grove-index diff` / `report`
- [ ] MIT LICENSE

---

## Risks

| Risk | Mitigation |
|------|------------|
| Premature without Boske RAG pain | Timebox design to 1 week; validate with one real Sources export |
| Scope creep into vector DB | Manifest only — explicit non-goal in README |

---

## Build order vs siblings

**Third** — real user pain but needs Boske RAG export to validate. Start after Guard spec or in parallel with Pack if RAG owner available.
