# Boske import — implementation checklist (closed)

Implement in the **Boske monorepo**, not in grove-port code.  
Grove Port provides open packages; Boske owns UX and DB mapping.

**Related:** Boske [ADR 0009](https://github.com/boske-ai/boske/blob/main/docs/decisions/0009-gdpr-and-migration-strategy.md) (GDPR / migration).

---

## Product entry points

| Surface | Use |
|---------|-----|
| Settings → **Import workspace** | Primary |
| Onboarding “Coming from ChatGPT?” | Funnel |
| Optional: drop `.grove-port` | Power users / CLI output |

---

## Recommended flow

```
Upload vendor file (.zip / .json)  OR  .grove-port
        │
        ▼
Detect format  (reuse convert-browser heuristics or CLI detect logic)
        │
        ▼
Preview dry-run  (conversations, messages, attachments, forks)
        │
        ▼
User confirms
        │
        ▼
@grove-port/adapter-*  →  Grove records  →  Boske ImportService → DB
        │
        ▼
Success summary  (+ optional “Download .grove-port backup”)
```

---

## Dependencies

```text
@grove-port/schema
@grove-port/core
@grove-port/adapter-chatgpt
@grove-port/adapter-claude
@grove-port/adapter-openwebui
@grove-port/adapter-librechat
@grove-port/adapter-gemini
@grove-port/adapter-doubao
@grove-port/adapter-deepseek
@grove-port/adapter-lobechat
@grove-port/adapter-anythingllm
```

Prefer **npm** once published; until then workspace / git dependency on the public repo.

---

## Feature checklist

| Feature | Priority | Notes |
|---------|----------|-------|
| ChatGPT ZIP (incl. **sharded** `conversations-NNN.json`) | P0 | Adapter already supports |
| Claude / Open WebUI / LibreChat | P0 | |
| Preview counts before write | P0 | No partial corrupt import |
| Attachments (`.dat` → file store) | P0 | ChatGPT |
| Gemini / Doubao / DeepSeek / LobeChat / AnythingLLM | P1 | Same adapters |
| Progress for large ZIPs | P0 | Desktop/server; not browser marketing |
| Rollback after failed import | P1 | Closed product |
| Import `.grove-port` directly | P1 | Skip adapter if already Grove |
| Reject Mistral with clear message | P1 | ADR 0001 |
| Optional post-import `.grove-port` download | P2 | Trust / portability |

---

## What stays closed (do not extract to grove-port)

- Import wizard components
- ImportService commit / dry-run APIs
- DB entity mappers and migrations
- User/org mapping, auth, cloud upload of workspace data
- Assisted migration / sales tooling

---

## Handoff from `/port`

Primary CTA on [boske.dev/port](https://boske.dev/port) should open:

- Logged-out → Boske signup / Local download with deep link to Import  
- Logged-in → Settings → Import  

No tarball POST from boske.dev.

---

## Suggested Boske work folder (create there)

When starting implementation in Boske:

```text
docs/work/active/<date>-grove-port-vendor-import/
  README.md
  plan.md
```

**Status (2026-07-15):** Implemented in Boske as `docs/work/active/2026-07-15-grove-port-vendor-import/` — Waves 1–3 complete (verify there; do not duplicate here).

Depend on this Grove Port folder’s [`open-vs-closed.md`](./open-vs-closed.md) for package boundaries.
