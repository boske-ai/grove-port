# Grove family — what's next

Grove Port is the **hub** (shipped). Other **Grove** projects share naming and values (local-first, privacy, EU-friendly) and ship on their own timeline.

**Brand split:**

| Brand | Grove projects (active backlog) |
|-------|----------------------------------|
| **Boske Community** | Guard, Index |
| **Boske Labs** | Pack spec, Trust |

---

## Shipped or in progress elsewhere

| Project | Where | Status |
|---------|-------|--------|
| **Grove Port** | `grove-port/` | Shipped — spec, CLI, adapters |
| **Online converter** | boske.dev/move | Shipped — pairs with Port |
| **Boske Pulse** | `boske-pulse/` | Done — Community MIT when public |
| **Grove Fit** | `boske-labs/grove-fit/` | In progress — hardware fit extract |

Port architecture: [README.md](../../README.md), [core-and-adapters.md](../architecture/core-and-adapters.md).

---

## 1. Grove Guard ⭐ (next — Community)

**One-liner:** Security gate between AI agents and tools (MCP) — deny-by-default, full audit log.

**Problem:** MCP usage exploded; enterprises fear shadow IT. Self-hosters run agents with no policy layer. OpenClaw-class incidents showed agents can abuse tools if unchecked.

**What it is:**

```
Agent ──► Grove Guard ──► allowed tools only
              │
              ├── policy.yaml (read email yes, send email no)
              ├── credential isolation
              └── immutable audit log
```

**Runs:** fully local — no SaaS required for OSS core.

**Comparable:** Lunar MCPX, Microsoft Agent Governance Toolkit, OpenZiti MCP gateway — mostly enterprise/K8s. Grove Guard targets **SMB + self-host + Boske desktop**.

**Brand:** Boske Community (trust + plugins).

**OSS:** MIT gateway + local audit viewer.

**Paid hook:** Boske Enterprise — org policy console, SIEM export, EU AI Act report templates, team tool catalog.

**Boske tie-in:** Enterprise “Work inbox MCP” ships with Guard patterns pre-wired.

**Work folder:** [`docs/work/active/2026-06-19-grove-guard/`](../work/active/2026-06-19-grove-guard/)

---

## 2. Grove Pack (spec only — Labs)

**One-liner:** Open **format** for assistant packs (Writing coach, Research, Meeting notes) — not the curated content.

**Problem:** Every AI app invents its own “mode” format. Community wants to share packs; Boske wants tier-gated **curated** packs without a store.

**What is open:**

```yaml
# grove-pack.yaml
id: writing-coach
version: 1
requiresNetwork: false
tierMinimum: local
systemPrompt: |
  ...
tools: [file-search, workspace-dock]
```

**What stays proprietary:** Boske Labs signed pack catalog, Enterprise vertical packs (legal, M365 inbox).

**Brand:** Boske Labs (spec + research); community submissions under Labs repo.

**OSS:** MIT spec + validator CLI.

**Paid hook:** Subscription includes curated, signed packs; Enterprise adds MCP packs.

**Distinction:** **Grove Pack** = format. **Boske Labs packs** = product feature with proprietary YAML in `apps/backend/config/labs/`.

**Work folder:** [`docs/work/active/2026-06-19-grove-pack/`](../work/active/2026-06-19-grove-pack/)

---

## 3. Grove Index (Community)

**One-liner:** RAG index lifecycle — know when your knowledge base is stale.

**Problem:** Tutorials teach “embed once”; production fails when docs change silently. Rebuilds take hours.

**What it is:**

- Manifest: `doc_id → content_hash → chunk_ids → embedded_at`
- Operations: incremental re-embed, stale alerts, “index health” report
- Not a vector DB — works **with** pgvector, Meilisearch, SQLite FTS

**Brand:** Boske Community (self-host docs focus).

**OSS:** MIT library `@grove-port/index`.

**Paid hook:** Boske Sources — team permissions, EU sync, cross-device incremental index.

**Work folder:** [`docs/work/active/2026-06-19-grove-index/`](../work/active/2026-06-19-grove-index/)

---

## 4. Grove Trust (Labs)

**One-liner:** Verify model files before load — checksum, provenance, org allowlist.

**Problem:** GGUF supply chain scares regulated buyers. llama.cpp has open issues for attestation; EU AI Act pushes documentation.

**What it is:**

- `grove-trust verify model.gguf --manifest signed.json`
- Policy: block load if signature missing (enterprise mode)

**Brand:** Boske Labs (research + compliance credibility).

**OSS:** MIT CLI + manifest spec.

**Paid hook:** Boske Enterprise approved model registry + audit export.

**Work folder:** [`docs/work/active/2026-06-19-grove-trust/`](../work/active/2026-06-19-grove-trust/)

---

## 5. Stack A Search (related, not Grove-branded)

**One-liner:** Self-host SearXNG + scrape stack runbook.

**Where:** Boske monorepo `infra/docker/searxng/` — could publish as Community infra doc repo.

**Not renamed Grove** — avoids confusion with Port. Listed here because it’s part of the same **privacy OSS** story.

**Paid hook:** Boske Cloud includes managed search.

**Status:** Backlog — no work folder yet (infra doc extract).

---

## Priority matrix (remaining)

| Project | Stars potential | Boske funnel | Build cost | Start when |
|---------|-----------------|--------------|------------|------------|
| **Grove Guard** | Very high | ★★★★ | High | **Now** — P1 |
| Grove Pack spec | Low | ★★★ | Low | P2 — parallel with Guard |
| Grove Index | Medium | ★★★ | Medium | P3 — after RAG export sample |
| Grove Trust | Low | ★★ | Medium | P4 — Enterprise pull |
| Stack A Search | Low | ★★ | Low | Opportunistic infra doc |

---

## Repo strategy (on disk)

```
canopystudio/apps/
├── boske/                      # Product (proprietary monorepo)
├── boske-community/            # Community OSS umbrella
│   ├── grove-port/             # Shipped
│   └── grove-guard/            # Next
├── boske-labs/
│   ├── grove-fit/              # In progress
│   ├── grove-pack/             # Planned
│   └── grove-trust/            # Planned
└── boske-pulse/                # Done
```

| Project | Folder | GitHub (planned) |
|---------|--------|------------------|
| Grove Guard | `boske-community/grove-guard/` | `boske-ai/grove-guard` |
| Grove Pack spec | `boske-labs/grove-pack/` | `boske-ai/grove-pack` |
| Grove Index | `boske-community/grove-index/` | `boske-ai/grove-index` |
| Grove Trust | `boske-labs/grove-trust/` | `boske-ai/grove-trust` |

---

## Messaging on boske.dev (draft)

**Grove Labs**  
> Research and tools for AI that runs where you do — model trust, assistant pack formats, hardware fit.

**Grove Community**  
> Open tools for safe, portable AI — workspace standards, migration, MCP policy, RAG ops.

**Boske product**  
> The private AI workspace — best place to import, work, and host in the EU.

---

## Next actions

1. Review and approve Grove Guard plan → execute.
2. Grove Pack spec in parallel with Boske skills-labs-v1 owner.
3. Grove Index — timebox design; validate with one Boske Sources export.
4. Grove Trust when Enterprise sales needs registry story.
5. Stack A Search — extract infra runbook when bandwidth allows.
