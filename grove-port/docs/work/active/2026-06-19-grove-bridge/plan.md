# Plan: Grove Bridge

**Draft:** 2026-06-19

---

## Goal

Ship **Grove Port → Open WebUI JSON** OUT adapter with honest loss preview — proof Boske is not a trap.

---

## Phase 1 — Spec

Document loss matrix per target:

| Grove collection | Open WebUI v1 OUT | Notes |
|------------------|-------------------|-------|
| conversations, messages | ✓ | Core |
| agents | ✗ | Flag in preview |
| files, attachments | partial | URLs or omit |
| transcript_sessions | ✗ | Future target |

---

## Phase 2 — CLI

```bash
grove-bridge convert in.grove-port --to openwebui -o out/
grove-bridge inspect in.grove-port --to openwebui   # loss preview only
```

Reuse `packages/schema` + adapter registry from Grove Port.

---

## Phase 3 — Marketing + Boske UX

| Task | Owner |
|------|-------|
| Settings → Export → “Also download Open WebUI format” | Boske product |
| boske.dev copy: “Leave anytime” | Website |
| Round-trip test: ChatGPT → Grove → Open WebUI → Grove (loss documented) | CI |

---

## Done criteria

- [ ] Open WebUI OUT produces importable JSON
- [ ] `inspect` shows loss counts before convert
- [ ] README with evaluator use case
- [ ] MIT LICENSE

---

## Build order

After Grove Port ChatGPT IN adapter. **High funnel value** — ship soon after move funnel works.
