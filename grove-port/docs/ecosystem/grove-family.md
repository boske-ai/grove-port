# Grove family — ecosystem beyond Grove Port

Grove Port is the **hub**. Other **Grove** projects share naming and values (local-first, privacy, EU-friendly) but ship on their own timeline.

**Brand split:**

| Brand | Grove projects |
|-------|----------------|
| **Boske Community** | Port, Guard, Index, **Pulse**, online converter |
| **Boske Labs** | Fit, Pack spec, Trust, benchmarks |
| **Proprietary** | Boske product, Labs pack **content**, license keys |

---

## 1. Grove Port ⭐ (this repo)

**One-liner:** Standard file format for a whole AI workspace.

**Status:** Active — foundation work started 2026-06-18.

**Funnel:** #1 — brings users from ChatGPT, Claude, Mistral, Open WebUI into Boske.

**OSS:** MIT, public GitHub.

**Paid hook:** Boske import, cloud, teams, migration services.

→ See [README.md](../../README.md) and [core-and-adapters.md](../architecture/core-and-adapters.md).

---

## 2. Grove Guard

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

**Status:** Planned — after Grove Port v1 + Boske MCP security cherry-picks land.

**Work folder:** create `docs/work/active/2026-XX-grove-guard/` when approved.

---

## 2b. Boske Pulse

**One-liner:** macOS menu bar + widget for **operators** running Boske on Hetzner/Coolify — health rollup, alerts.

**Not Grove-branded** but **Boske Community OSS** (MIT when public) — same trust bucket as Port.

**Problem:** Operators juggle Coolify, Hetzner, Tailscale, Telegram; need one local HUD.

**What stays closed until sanitize:** real IPs in example config; repo private until scrub.

**Paid hook:** None directly — supports people who **host** Boske (self-host funnel + credibility).

**Status:** Active development private; OSS path in [`../../../../boske-pulse/MANIFEST.md`](../../../../boske-pulse/MANIFEST.md).

**Checklist before public:** [`../../../docs/INDEX.md`](../../../docs/INDEX.md) §14.

---

## 3. Grove Fit

**One-liner:** “Can my machine run this model?” — open hardware fit engine.

**Problem:** Local AI friction is ops and sizing, not model quality. Users download Forest on 8 GB RAM and blame the product.

**What it is:**

- Input: RAM, VRAM, GPU backend fingerprint
- Output: tier fit — `recommended` | `marginal` | `unavailable`
- Adapters: Boske tiers (Seed→Forest), generic llama.cpp context sizes

**Source in Boske:** `apps/desktop/hardware-fit.js` — extract to `@grove-port/fit` or `grove-fit` repo.

**Brand:** Boske Labs (efficiency research, benchmarks).

**OSS:** MIT library + CLI `grove-fit scan`.

**Paid hook:** Boske desktop — polished UI, model downloader, certified bundles.

**Marketing:** “Grove Fit certified” badge on model cards in Boske.

**Status:** Planned — extract after Port schema ships.

---

## 4. Grove Pack (spec only)

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

**Brand:** Boske Labs (spec + research); community submissions under Community repo.

**OSS:** MIT spec + validator CLI.

**Paid hook:** Subscription includes curated, signed packs; Enterprise adds MCP packs.

**Status:** Planned — aligns with `apps/boske/docs/work/active/2026-06-08-skills-labs-v1/`.

**Distinction:** **Grove Pack** = format. **Boske Labs packs** = product feature with proprietary YAML in `apps/backend/config/labs/`.

---

## 5. Grove Index

**One-liner:** RAG index lifecycle — know when your knowledge base is stale.

**Problem:** Tutorials teach “embed once”; production fails when docs change silently. Rebuilds take hours.

**What it is:**

- Manifest: `doc_id → content_hash → chunk_ids → embedded_at`
- Operations: incremental re-embed, stale alerts, “index health” report
- Not a vector DB — works **with** pgvector, Meilisearch, SQLite FTS

**Brand:** Boske Community or Labs (TBD — lean Community if self-host docs focus).

**OSS:** MIT library `@grove-port/index`.

**Paid hook:** Boske Sources — team permissions, EU sync, cross-device incremental index.

**Status:** Planned — no Boske extraction yet; design when RAG ops pain justifies.

---

## 6. Grove Trust

**One-liner:** Verify model files before load — checksum, provenance, org allowlist.

**Problem:** GGUF supply chain scares regulated buyers. llama.cpp has open issues for attestation; EU AI Act pushes documentation.

**What it is:**

- `grove-trust verify model.gguf --manifest signed.json`
- Policy: block load if signature missing (enterprise mode)

**Brand:** Boske Labs (research + compliance credibility).

**OSS:** MIT CLI + manifest spec.

**Paid hook:** Boske Enterprise approved model registry + audit export.

**Status:** Planned — research track, not v1 launch blocker.

---

## 7. Stack A Search (related, not Grove-branded)

**One-liner:** Self-host SearXNG + scrape stack runbook.

**Where:** Boske monorepo `infra/docker/searxng/` — could publish as Community infra doc repo.

**Not renamed Grove** — avoids confusion with Port. Listed here because it’s part of the same **privacy OSS** story.

**Paid hook:** Boske Cloud includes managed search.

---

## Priority matrix

| Project | Stars potential | Boske funnel | Build cost | v1 launch? |
|---------|-----------------|--------------|------------|------------|
| **Grove Port** | High | ★★★★★ | Low (extract) | **Yes** |
| Online converter | Medium | ★★★★★ | Medium | **Yes (after Port)** |
| Grove Guard | Very high | ★★★★ | High | Phase 2 |
| Grove Fit | Medium | ★★★ | Low (extract) | Phase 2 |
| Grove Pack spec | Low | ★★★ | Low | With Labs packs |
| Grove Index | Medium | ★★★ | Medium | Later |
| Grove Trust | Low | ★★ | Medium | Later |

---

## Repo strategy (on disk)

```
canopystudio/apps/
├── boske/                      # Product (proprietary monorepo)
├── boske-community/            # Community OSS umbrella
│   ├── README.md               # Hub
│   └── grove-port/             # Flagship project (git repo)
├── boske-labs/                 # Labs OSS index + future extracts
│   └── README.md
├── boske-pulse/                # Operator tool → Community MIT
```

| Project | Folder | GitHub (planned) |
|---------|--------|------------------|
| Grove Port (+ adapters, CLI) | `boske-community/grove-port/` | `boske-ai/grove-port` |
| Boske Pulse | `boske-pulse/` (sibling) | `boske-ai/boske-pulse` |
| Grove Guard | `boske-community/grove-guard/` (later) | `boske-ai/grove-guard` |
| Grove Fit | `boske-labs/grove-fit/` (later) | `boske-ai/grove-fit` |
| Grove Pack spec | `boske-labs/grove-pack/` (later) | `boske-ai/grove-pack` |
| Converter web UI | Boske website `/move` | imports npm from grove-port |

Keep **one flagship public narrative:** Grove Port first; spin siblings when each has a clear MVP.

---

## Messaging on boske.dev (draft)

**Grove Port (Community)**  
> Open standard for your AI workspace. Export everything. Verify anywhere. Move to Boske in one step.

**Grove Labs**  
> Research and tools for AI that runs where you do — hardware fit, model trust, assistant pack formats.

**Boske product**  
> The private AI workspace — best place to import, work, and host in the EU.

---

## Next actions (from ecosystem view)

1. Execute Grove Port foundation plan.
2. Ship boske.dev/move converter (ChatGPT first).
3. Link from Boske Data Promise + pricing pages.
4. When MCP security lands in Boske — draft Grove Guard work folder.
5. Extract hardware-fit → Grove Fit as Labs OSS beat.
