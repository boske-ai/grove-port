# Online converter — boske.dev migration tool

**Status:** **shipped** — boske.dev/move live (pairs with Grove Port)  
**Started:** 2026-06-18 · **Archived:** 2026-06-19

---

## What

A **public web tool** on boske.dev that lets anyone convert a vendor export into a **Grove Port** file — optimized for **“move your workspace to Boske”** without installing CLI.

Working title: **Grove Port Converter** or **Move to Boske**.

---

## Why

| Audience | Pain | Converter fix |
|----------|------|---------------|
| ChatGPT refugees | Don't know what CLI is | Drag ZIP → download `.grove-port` |
| Open WebUI self-hosters | JSON export only | Same flow + link to Boske Local |
| EU teams evaluating Boske | Need proof of portability | Try convert before signup |
| Sales / support | Manual migration | Send link + import guide |

**This is the top-of-funnel:** free, trustworthy, no account required for convert-only.

---

## User flow (v1)

```
1. Land on boske.dev/move  (or /tools/grove-port)
2. Choose source: ChatGPT | Claude | Mistral | Open WebUI | Already Grove Port
3. Upload file (or ZIP)
4. [Processing]
   - Prefer: Web Worker / WASM — file never leaves browser
   - Fallback: edge function with zero retention + delete after response
5. Show preview: "412 conversations, 0 agents, 0 files"
6. Actions:
   a) Download .grove-port
   b) "Import into Boske" → OAuth → handoff to app import (logged-in)
7. Footer: link to open spec on GitHub
```

---

## Privacy (non-negotiable)

Align with [STUDIO_MANIFEST.md](../../../../docs/STUDIO_MANIFEST.md):

- **No retention** of uploaded exports on server
- **No training** on uploaded content
- **Clear copy:** what leaves the device vs what is processed locally
- **No account required** for download-only path
- Log only aggregate metrics (conversion success/fail counts), not content

---

## Technical options

| Approach | Pros | Cons |
|----------|------|------|
| **Client-only (recommended v1)** | Strongest privacy story; works offline after load | Large JS bundle; memory limits on huge exports |
| **Edge convert + stream back** | Handles 500MB+ exports | Must prove zero retention; EU region only |
| **CLI-only** | Simplest | Weak funnel |

**Recommendation:** client-only for ChatGPT/Claude JSON; edge optional for huge Open WebUI DB dumps (P2).

**Reuse:** `packages/adapters/*` and `packages/schema` from this repo; website imports published npm `@grove-port/adapters` or bundles via turbo.

---

## UX copy (draft)

> **Move your AI history to Boske**  
> Upload your ChatGPT or Claude export. We convert it to Grove Port — an open standard — right in your browser. Your file is not stored on our servers.  
> [Upload] · [Read the spec]

---

## Links

- Foundation: [`../2026-06-18-grove-port-foundation/`](../2026-06-18-grove-port-foundation/)
- Three layers: [`../../architecture/three-layers.md`](../../architecture/three-layers.md)

---

## Out of scope (v1)

- OUT adapters (Grove → ChatGPT)
- Batch org migration (enterprise — sales-assisted in Boske product)
- Open WebUI SQLite upload (P2 — warn on file size)
