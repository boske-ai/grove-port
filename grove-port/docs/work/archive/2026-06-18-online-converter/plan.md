# Plan: Online Grove Port converter

**Approved:** 2026-06-18  
**Depends on:** [`2026-06-18-grove-port-foundation`](../2026-06-18-grove-port-foundation/)

---

## Goal

Ship **boske.dev/move** (URL TBD): browser-based ChatGPT → Grove Port conversion with optional one-click Boske import.

---

## Phase 1 — Static page + client convert

| Task | Notes |
|------|-------|
| Route on `apps/boske/apps/website` | `/move` or `/tools/grove-port` |
| Bundle `@grove-port/adapters` (chatgpt) | Tree-shaken; no Node-only APIs in client path |
| Web Worker for parse + convert | Keep UI responsive |
| Preview component | Reuse counts shape from `inspect` |
| Download `.grove-port` blob | Tar in browser (e.g. fflate + manual manifest) |

---

## Phase 2 — Boske import handoff

| Task | Notes |
|------|-------|
| Logged-in: POST tarball to `/api/import/grove-port/preview` | Boske backend dry-run |
| Confirm → `/api/import/grove-port/commit` | Existing ImportService |
| Anonymous: download only | No account |

---

## Phase 3 — More sources + polish

- Claude, Mistral, Open WebUI JSON in dropdown
- FR/NL/DE strings (website i18n)
- SEO: "import ChatGPT to Boske", "ChatGPT export converter"
- Link from pricing / Data Promise page

---

## Done criteria

- [ ] ChatGPT ZIP converts fully client-side on boske.dev
- [ ] Privacy page section documents zero retention
- [ ] Download works without login
- [ ] Import handoff works for authenticated Boske user
- [ ] Link to `github.com/boske-ai/grove-port` spec

---

## Metrics (privacy-safe)

- `convert_started` / `convert_succeeded` / `convert_failed` (no PII)
- `download_clicked` vs `import_to_boske_clicked`
- Source platform selected (enum only)
