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
     ┌──────────┬──────────┼──────────┬──────────┬──────────┐
     │ ChatGPT  │  Claude  │ Mistral  │OpenWebUI │ AMP/PAM  │
     │  export  │  export  │  export  │   JSON   │  bundle  │
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
| Mistral Le Chat | Settings export file | No |
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
