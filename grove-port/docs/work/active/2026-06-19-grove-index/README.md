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

## The smart insight

RAG tutorials say “embed your docs once.” Production fails when docs **change silently**.  
**Grove Index** = git for embeddings — manifest + diff, any vector backend.

---

## Real-life use cases

### 1. “The bot quoted last year’s pricing”

Sales wiki updated; 40k chunks stale. Customer-facing bot cites removed SKU.  
**Index:** `grove-index diff` → 23 stale docs → re-embed only those chunks (not 4-hour full rebuild).

### 2. Friday demo health check

Ops runs `grove-index report` before investor demo: “94% fresh, 6% stale > 30d.”

### 3. Self-host NAS + Boske Local

Nightly cron: diff manifest vs filesystem. Telegram alert from Boske Pulse when stale > 10%.

### 4. Cloud team sync

Boske Sources writes manifest; EU Cloud incremental sync uses same manifest across devices (paid).

→ Full scenarios: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Index

---

## What already exists in Boske

| Asset | Status |
|-------|--------|
| Boske Sources embed pipeline | Export sample needed to lock manifest |
| File watcher / content hashes | Likely pattern to mirror |
| pgvector storage | Stays in product — Index is manifest only |

→ [`../../ecosystem/boske-extracts.md`](../../ecosystem/boske-extracts.md)

**Validation gate:** One real Sources export before coding.

---

## Brand & license

- **Boske Community**
- OSS: MIT `@grove-port/index`
- **Paid hook:** Boske Sources — team permissions, EU sync, cross-device incremental index

---

## Links

- Plan: [`plan.md`](./plan.md)
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md)
- Pairs with: Stack A Search (fresh web sources)

---

## Out of scope (v1)

- Embedding model runner
- Vector database implementation
