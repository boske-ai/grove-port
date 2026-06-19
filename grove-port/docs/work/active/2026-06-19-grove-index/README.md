# Grove Index — RAG index lifecycle

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Open library for **RAG index lifecycle** — know when your knowledge base is stale, incremental re-embed, health reports.

- Manifest: `doc_id → content_hash → chunk_ids → embedded_at`
- Operations: incremental re-embed, stale alerts, “index health” report
- **Not** a vector DB — works **with** pgvector, Meilisearch, SQLite FTS

---

## Why

| Audience | Pain | Index fix |
|----------|------|-----------|
| Self-host RAG users | “Embed once” tutorials; docs change silently | Stale detection + incremental rebuild |
| Boske Sources users | Full re-index takes hours | Manifest-driven delta embed |
| Ops | No visibility into index health | `grove-index report` |

---

## Brand & license

- **Boske Community** (lean Community if self-host docs focus)
- OSS: MIT `@grove-port/index` or `grove-index` package
- **Paid hook:** Boske Sources — team permissions, EU sync, cross-device incremental index

---

## Dependencies

- Design-first — no Boske extraction yet
- Informed by Boske Sources / RAG pipeline when pain justifies

---

## Links

- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md) § Grove Index

---

## Out of scope (v1)

- Embedding model runner
- Vector database implementation
