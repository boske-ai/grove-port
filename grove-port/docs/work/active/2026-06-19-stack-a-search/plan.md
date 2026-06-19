# Plan: Stack A Search

**Draft:** 2026-06-19

---

## Goal

Publish scrubbed SearXNG stack from Boske monorepo as Community self-host kit.

---

## Phase 1 — Extract

| Task | Output |
|------|--------|
| Copy `infra/docker/searxng/` | New repo or `boske-community/stack-a-search/` |
| Scrub secrets / real hosts | Example `.env.example` only |
| Hardening checklist | TLS, rate limits, EU hosting notes |

---

## Phase 2 — Docs

| Section | Content |
|---------|---------|
| Quick start | `docker compose up` in 10 minutes |
| Boske Sources | How to point web source at local SearXNG |
| Grove Index | Optional: index health for scraped pages |

---

## Phase 3 — Website

boske.dev/docs/self-host/search → links repo + Boske Cloud upsell.

---

## Done criteria

- [ ] Compose runs on clean VM
- [ ] No production secrets in git
- [ ] MIT LICENSE
- [ ] Linked from Community landing (when exists)

---

## Build order

**Opportunistic** — ship when someone has half a day; high doc value, low code.
