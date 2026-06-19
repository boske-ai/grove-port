# Grove family — what's next

Grove Port is the **hub** (in progress). Other **Grove** projects share naming and values (local-first, privacy, EU-friendly) and ship on their own timeline.

**Brand split:**

| Brand | Grove projects (active backlog) |
|-------|----------------------------------|
| **Boske Community** | Guard, Index |
| **Boske Labs** | Pack spec, Trust |

---

## In progress

| Project | Where | Status |
|---------|-------|--------|
| **Grove Port** | `grove-port/` | In progress — spec, CLI, adapters |
| **Online converter** | boske.dev/move | In progress — pairs with Port |
| **Grove Fit** | `boske-labs/grove-fit/` | In progress — hardware fit extract |

## Done (reference only)

| Project | Where | Status |
|---------|-------|--------|
| **Boske Pulse** | `boske-pulse/` | Done — Community MIT when public |

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

## 5. Grove Bridge (Community) — OUT adapters

**One-liner:** Grove Port → Open WebUI / AMP / LibreChat — prove Boske is not a trap.

**Real-life hook:** CTO trial with weekly export; GDPR officer needs vendor-neutral + legacy format; sales answers “what if we leave?”

**OSS:** MIT `grove-bridge convert --to openwebui`.

**Paid hook:** Enterprise assisted migration (product).

**Depends on:** Grove Port IN adapters (reverse mapping).

**Work folder:** [`docs/work/active/2026-06-19-grove-bridge/`](../work/active/2026-06-19-grove-bridge/)

---

## 6. Grove Sign (Community) — shared crypto

**One-liner:** One ed25519 stack for Port, Trust, Pack — extract from `export-v1` today.

**Work folder:** [`docs/work/active/2026-06-19-grove-sign/`](../work/active/2026-06-19-grove-sign/)

---

## 7. Grove Vault (Community) — MCP credentials

**One-liner:** API keys never in the agent — `vault://` broker; Guard adds policy on top.

**Work folder:** [`docs/work/active/2026-06-19-grove-vault/`](../work/active/2026-06-19-grove-vault/)

---

## 8. Stack A Search (related, not Grove-branded)

**One-liner:** Self-host SearXNG + scrape stack runbook.

**Where:** Boske monorepo `infra/docker/searxng/` — could publish as Community infra doc repo.

**Not renamed Grove** — avoids confusion with Port. Listed here because it’s part of the same **privacy OSS** story.

**Paid hook:** Boske Cloud includes managed search.

**Status:** Work folder ready — extract from Boske `infra/docker/searxng/`.

**Work folder:** [`docs/work/active/2026-06-19-stack-a-search/`](../work/active/2026-06-19-stack-a-search/)

---

## Real-life use cases (all projects)

See [`use-cases.md`](./use-cases.md) and [`boske-extracts.md`](./boske-extracts.md).

---

## Priority matrix (remaining)

| Project | Stars potential | Boske funnel | Build cost | Real-life hook | Start when |
|---------|-----------------|--------------|------------|----------------|------------|
| **Grove Guard** | Very high | ★★★★ | High | Agent emailed wrong person | **P1** |
| **Grove Sign** | Medium | ★★ | Low | One verify story | **P1** (parallel, extract) |
| **Grove Pack** | Low | ★★★ | Low | Same mode in 3 apps | **P2** |
| **Grove Bridge** | Medium | ★★★★ | Medium | Not a trap / trial eval | **P2** (after Port IN) |
| **Grove Vault** | Medium | ★★★ | Medium | Keys in prompt | **P2** (before Guard v2) |
| **Grove Index** | Medium | ★★★ | Medium | Stale pricing in RAG | **P3** |
| **Grove Trust** | Low | ★★ | Medium | Unsigned GGUF | **P4** |
| **Stack A Search** | Low | ★★ | Low | Private web for RAG | Opportunistic |

---

## Repo strategy (on disk)

```
canopystudio/apps/
├── boske/                      # Product (proprietary monorepo)
├── boske-community/            # Community OSS umbrella
│   ├── grove-port/             # In progress
│   ├── grove-guard/            # P1
│   ├── grove-bridge/           # P2
│   ├── grove-vault/            # P2
│   ├── grove-sign/             # P1 extract
│   └── grove-index/            # P3
├── boske-labs/
│   ├── grove-fit/              # In progress
│   ├── grove-pack/             # P2
│   └── grove-trust/            # P4
├── stack-a-search/             # Infra (not Grove-branded)
└── boske-pulse/                # Done
```

| Project | Folder | GitHub (planned) |
|---------|--------|------------------|
| Grove Guard | `boske-community/grove-guard/` | `boske-ai/grove-guard` |
| Grove Pack spec | `boske-labs/grove-pack/` | `boske-ai/grove-pack` |
| Grove Index | `boske-community/grove-index/` | `boske-ai/grove-index` |
| Grove Bridge | `boske-community/grove-bridge/` | `boske-ai/grove-bridge` |
| Grove Sign | `boske-community/grove-sign/` | `boske-ai/grove-sign` |
| Grove Vault | `boske-community/grove-vault/` | `boske-ai/grove-vault` |
| Grove Trust | `boske-labs/grove-trust/` | `boske-ai/grove-trust` |
| Stack A Search | `boske-community/stack-a-search/` | `boske-ai/stack-a-search` |

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

1. **Grove Sign** — extract from `export-v1` (unblocks Trust + Port verify).
2. **Grove Guard** + **Grove Vault** — approve plans; Vault can ship narrower v1 first.
3. **Grove Pack** — sync with skills-labs-v1 owner; validate YAML shape.
4. **Grove Bridge** — after Port ChatGPT IN adapter (OUT = trust mirror).
5. **Grove Index** — one Boske Sources export sample before coding.
6. **Stack A Search** — half-day extract from `infra/docker/searxng/`.
7. **Grove Trust** — when Enterprise needs registry story.

Detail: [`use-cases.md`](./use-cases.md) · [`boske-extracts.md`](./boske-extracts.md)
