# Stack A Search — self-host private web search

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Community infra repo: **SearXNG + scrape stack** for RAG and agent web search — runbook, Docker Compose, EU self-host hardening.

**Not Grove-branded** — avoids confusion with Grove Port. Same Boske Community trust bucket.

---

## The smart insight

Self-host RAG users won’t send queries to Google. Boske already runs this stack in production — **publish the runbook**, not another search engine.

Pairs with Grove Index (fresh local docs) and Boske Sources (web + files).

---

## Real-life use cases

### 1. Open WebUI self-hoster adds private search

Follow Stack A compose on homelab; point agent web tool at local SearXNG.

### 2. EU team evaluates Boske

Runs same stack locally; upgrades to Boske Cloud managed search when ops burden bites.

### 3. Air-gapped-ish lab

Outbound web only through self-host SearXNG; no query data to US search APIs.

---

## What already exists in Boske

| Asset | Path |
|-------|------|
| Docker compose | `apps/boske/infra/docker/searxng/` |
| Scrape config | Same tree |

**Effort:** Low — extract + scrub secrets + hardening checklist.

---

## Brand & license

- **Boske Community** (infra docs)
- OSS: MIT compose + markdown runbook
- **Paid hook:** Boske Cloud managed search

---

## Links

- Plan: [`plan.md`](./plan.md)
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Stack A Search

---

## Out of scope (v1)

- Custom search engine
- Grove Port adapter for search history
