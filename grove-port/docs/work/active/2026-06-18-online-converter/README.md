# Online converter — pivoted to `/move` landing

**Status:** **pivoted 2026-07-15** — production `/move` becomes landing-only (no upload)  
**Started:** 2026-06-18  
**Superseded by:** [`../2026-07-15-move-landing-open-repo-boske-import/`](../2026-07-15-move-landing-open-repo-boske-import/)

---

## What changed

| Before | After |
|--------|--------|
| Upload on boske.dev → browser convert → download | **No processing** on boske.dev |
| Phase 2: POST tarball to Boske API | **Cancelled** — import lives in Boske app |
| Converter embed as funnel | Landing + CTA → Boske Import |

Phase 1 (static converter + Web Worker + embed) remains in-repo as **optional dev tooling**, not the production funnel.

---

## Historical goal (Phase 1 — shipped)

A public web tool on boske.dev that converted vendor exports client-side. Useful for prototypes; superseded by privacy-first landing + Boske-native import.

### What still exists in this repo

| Asset | Role now |
|-------|----------|
| `apps/converter-web` | Dev / demo only — do not sync to production `/move` |
| `@grove-port/convert-browser` | Library for Boske or other apps |
| Adapter `./browser` entry points | Still valid for in-app use |

---

## Follow this folder for current work

| Track | Doc |
|-------|-----|
| Website landing | [`website-move.md`](../2026-07-15-move-landing-open-repo-boske-import/website-move.md) |
| Open vs closed | [`open-vs-closed.md`](../2026-07-15-move-landing-open-repo-boske-import/open-vs-closed.md) |
| Boske import | [`boske-import.md`](../2026-07-15-move-landing-open-repo-boske-import/boske-import.md) |
| Master plan | [`plan.md`](../2026-07-15-move-landing-open-repo-boske-import/plan.md) |

Archive this folder when the landing ships and converter sync is retired.
