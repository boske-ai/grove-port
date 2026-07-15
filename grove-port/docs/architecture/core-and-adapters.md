# Core + adapters

Grove Port is **one standard file** at the center. Everything else translates at the edges.

---

## Diagram

```
                    ┌─────────────────────────────────┐
                    │     GROVE PORT CORE (OSS)       │
                    │  manifest + data.json + files   │
                    │  + signature + verify/inspect   │
                    └─────────────────────────────────┘
                           ▲              │
              IN adapters  │              │  OUT adapters (optional)
                           │              ▼
     ┌──────────┬──────────┬──────────┬──────────┬──────────┐
     │ ChatGPT  │  Claude  │OpenWebUI │LibreChat │ AMP/PAM  │
     │  export  │  export  │   JSON   │   JSON   │  bundle  │
     └──────────┴──────────┴──────────┴──────────┴──────────┘
                           │
                           │  Boske native (product — not OSS adapter)
                           ▼
              ┌────────────────────────────┐
              │  Boske Export / Import     │
              │  SQLite │ Postgres │ Mongo │
              └────────────────────────────┘
```

---

## Three adapter types

| Type | Direction | Example | Open source? |
|------|-----------|---------|--------------|
| **IN** | Foreign → Grove | `convert --from chatgpt` | Yes (Community) |
| **OUT** | Grove → Foreign | `convert --to openwebui` | Yes (optional) |
| **Native** | Boske DB ↔ Grove | Settings → Export | No (product) |

**IN adapters** are the migration funnel — bring clients **to** Boske.

**OUT adapters** build trust (“we’re not a trap”) and community contributions.

**Native** mapping knows Boske’s database; stays in the Boske monorepo.

---

## What IN adapters read (not always a database)

| Source | Adapter input | Touches DB? |
|--------|---------------|-------------|
| ChatGPT | `conversations.json` from Settings export ZIP | No |
| Claude | Anthropic export JSON | No |
| Mistral Le Chat | Settings export | **Not supported** ([ADR 0001](../decisions/0001-no-mistral-support.md)) |
| Open WebUI (simple) | JSON chat export from UI | No |
| Open WebUI (deep) | `webui.db` SQLite file | Yes — **special adapter** reads their DB |
| LibreChat | JSON export | No |
| Cursor | Local SQLite | Yes — special adapter |
| AMP / PAM | Standard JSON bundle | No — reuse their work, add Grove “fat layer” |

**Rule:** default adapters only read **export files**. DB adapters are explicit, documented, and harder — Phase 2.

---

## Partial fills are normal

ChatGPT adapter might produce:

| Collection | ChatGPT | Full Boske export |
|------------|---------|-------------------|
| conversations | ✅ | ✅ |
| messages | ✅ | ✅ |
| attachments | ⚠️ partial | ✅ |
| agents | ❌ | ✅ |
| transcript_sessions | ❌ | ✅ |

`grove-port inspect` and Boske import **preview** must show this honestly:

> *412 conversations · 0 agents · 0 files — import anyway?*

---

## Postgres vs SQLite vs Mongo

**Grove Port does not care.**

| System | Role |
|--------|------|
| Grove Port `data.json` | Neutral JSON — the contract |
| ChatGPT adapter | Reads JSON file only |
| Boske Local | Export: SQLite → JSON → tarball |
| Boske Cloud | Export: Postgres → same JSON → same tarball |
| Boske Import | Tarball → JSON → writes target DB |

Same `.grove-port` file whether it came from laptop SQLite or EU Postgres cloud.

---

## Online converter = IN adapter in the browser

```
User uploads ChatGPT ZIP
        │
        ▼
  [chatgpt IN adapter]  ← same code as CLI
        │
        ▼
  .grove-port download  OR  → Boske import API
```

No separate format for web vs CLI — one adapter library.

---

## Versioning

- **v1** wire format ≡ Boske `boske-export-v1`
- Public name: **Grove Port v1**
- Breaking changes → **v2** with explicit rejection of unknown versions (already in Boske schema)

---

## Competitors (what we’re not duplicating)

| Project | Scope | Grove Port difference |
|---------|-------|----------------------|
| AMP / purmemo | Conversations + memory | + files in box + agents + transcripts + team paths |
| PAM | Memories + conversation index | + full workspace + attachments |
| Agent File (.af) | Single agent | Whole workspace |
| Open WebUI import | Chats only JSON | Standard + cross-vendor + signed |

We can **import from** AMP/PAM as IN adapters; Grove Port is the **superset** hub.

---

## Global migration targets (outside EU focus)

Strategy: support **competitors worldwide** via IN adapters — official exports first, normalized third-party JSON second, DB/browser capture last. Mistral is **out of scope** ([ADR 0001](../decisions/0001-no-mistral-support.md)).

### Shipped IN adapters

| Platform | HQ / market | Export path | Status |
|----------|-------------|-------------|--------|
| ChatGPT | US | Settings → ZIP (`conversations.json`) | ✅ |
| Claude | US | Privacy export ZIP | ✅ |
| Open WebUI | Global OSS | UI JSON export | ✅ |
| LibreChat | Global OSS | UI JSON export | ✅ |
| Google Gemini | US | Google Takeout → Gemini Apps JSON | ✅ |
| Doubao 豆包 | China (ByteDance) | Web bulk ZIP (`metadata.json` + `chat_*/`) | ✅ |
| DeepSeek | China | Settings → Export Data ZIP | ✅ |
| LobeChat | Global OSS | OpenAI-format JSON export | ✅ |
| AnythingLLM | US OSS | Workspace JSON / JSONL export | ✅ |

### Tier A — Official bulk export (build next)

| Platform | HQ / market | Export path | Adapter effort |
|----------|-------------|-------------|----------------|
| **AMP / PAM** | US OSS | Standard JSON bundle | Low — reuse their schema |

### Tier B — China + APAC SaaS (export via ZIP/JSON or extension-normalized)

| Platform | HQ / market | Export path | Notes |
|----------|-------------|-------------|-------|
| **Kimi** 月之暗面 | China | No official bulk; community JSON (chat-export-toolkit L2) | Needs real API/DOM samples |
| **Tencent Yuanbao** 元宝 | China | Extension JSON/Markdown (chat-export-toolkit L1) | Third-party format — define `yuanbao-export-v1` |
| **Qwen / Tongyi** 通义千问 | China (Alibaba) | Extension copy; no official bulk | DOM/API research |
| **Ernie / 文心一言** | China (Baidu) | No official bulk | Hard — anti-automation risk |
| **iFlytek Spark** 讯飞星火 | China | Extension copy only | Lower priority |
| **Zhipu GLM** 智谱清言 | China | Extension copy only | Lower priority |

### Tier C — US / global SaaS (weak or no native export)

| Platform | HQ / market | Export path | Grove Port approach |
|----------|-------------|-------------|---------------------|
| **Perplexity** | US | PDF per thread; extension JSON | Extension-normalized IN adapter or decline |
| **Microsoft Copilot** | US | Per-response Word/PDF; no bulk | Per-thread DOCX parser or extension JSON |
| **Grok** (xAI) | US | No official bulk; extension JSON | Extension-normalized |
| **Poe** (Quora) | US | No bulk; @export-chat bot; extension JSON | Extension-normalized |
| **Meta AI** | US | No bulk; extension DOM | Extension-normalized |
| **Character.ai** | US | No bulk | Low priority — entertainment use case |
| **Pi** (Inflection) | US | No bulk | Niche |
| **You.com** | US | Extension copy | Extension-normalized |
| **Phind** | US | Extension copy | Dev niche |
| **HuggingChat** | US/EU OSS | HF account export TBD | Watch HF data policy |
| **NotebookLM** | US | Google ecosystem | Takeout overlap with Gemini |

### Tier D — Self-hosted / dev tools (global OSS)

| Platform | Market | Export path | Priority |
|----------|--------|-------------|----------|
| **LobeChat** / LobeHub | Global OSS | Postgres/PGlite dump (JSON export ✅) | DB adapter — follow-up |
| **AnythingLLM** | US OSS | Workspace CSV (JSON/JSONL ✅) | CSV export — follow-up |
| **ChatbotUI** (legacy) | Global OSS | JSON (LibreChat already imports this) | Low — overlap LibreChat |
| **Cursor** | US | Local SQLite | P3 — dev niche, DB adapter |
| **Windsurf / Codeium** | US | IDE-local storage | P3 — research needed |

### Tier E — Not Grove Port IN targets (different product layer)

| Category | Examples | Why skip as chat IN adapter |
|----------|----------|----------------------------|
| Enterprise suites | Teams Copilot, Slack AI, Notion AI | Workspace lock-in; export is notes not chat DAG |
| Memory-only formats | Agent File (.af), ALF | Single-agent, not full workspace |
| EU-only funnel | Mistral Le Chat | **Product decision** — ADR 0001 |

### Export feasibility legend

| Label | Meaning |
|-------|---------|
| **Official** | Vendor provides bulk JSON/ZIP/Takeout — preferred for `grove-port convert` |
| **Extension** | Browser tools (ChatArchive, chat-export-toolkit, SaveAIChat) — normalize to a Grove `source_format` |
| **DB** | SQLite/Postgres file — explicit “special adapter”, not browser converter |
| **Manual** | Copy/paste, PDF, Word — last resort; poor funnel UX |

### Recommended global rollout (next)

1. **Kimi + Yuanbao + Qwen** — China/APAC long tail via extension-normalized formats  
2. **Poe + Perplexity** — extension-normalized formats (document privacy story)  
3. **LobeChat / AnythingLLM DB exports** — Postgres/PGlite and CSV paths  
4. **AMP / PAM** — reuse existing converters as IN adapters  

Prior art for extension formats: [ChatArchive](https://github.com/Weiykong/ChatArchive), [chat-export-toolkit](https://github.com/gandli/chat-export-toolkit) (CN platform matrix).
