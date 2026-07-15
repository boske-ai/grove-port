# Plan: Online Grove Port converter → pivoted

**Approved:** 2026-06-18 · **Pivoted:** 2026-07-15  
**Depends on:** foundation (archived)  
**Superseded by:** [`../2026-07-15-move-landing-open-repo-boske-import/plan.md`](../2026-07-15-move-landing-open-repo-boske-import/plan.md)

### Grove Port repo progress

| Done | Item |
|------|------|
| ✅ | `@grove-port/core/browser` — `packEnvelopeBytes`, Web Crypto signing, tar via fflate |
| ✅ | Adapter `./browser` entry points — no Node APIs |
| ✅ | `@grove-port/convert-browser` — preview + convert from `Uint8Array` |
| ✅ | `apps/converter-web` — Vite UI (dev/demo; **not** production funnel) |
| ✅ | Route on boske.dev website — `/move` (embed to be replaced by landing) |
| ❌ | Phase 2 web→API handoff — **cancelled** (import in Boske app) |
| ➡️ | Landing-only `/move` + public repo + Boske import — **new work folder** |

---

## Goal (historical)

Browser-based convert on boske.dev with optional Boske import handoff.

## Goal (current)

See **move-landing** plan: website educates; Boske imports; grove-port stays open CLI + adapters.

---

## Phase 1 — Static page + client convert (shipped, demoted)

Kept as library + optional local demo. Do not treat as production funnel.

## Phase 2 — Boske import handoff (cancelled)

Replaced by **in-app** vendor import using `@grove-port/adapter-*`. No POST of tarballs from boske.dev.

## Phase 3 — Polish (moved)

- Landing i18n / SEO → website-move track
- More sources → adapter work folders / Boske import checklist

---

## Done criteria (updated)

- [x] Client convert library exists (`convert-browser` + adapters)
- [ ] Production `/move` is landing-only (no upload)
- [ ] Privacy copy: boske.dev does not receive exports
- [ ] Boske in-app import (closed) — Boske monorepo
- [ ] Link to public `github.com/boske-ai/grove-port` spec

---

## Metrics (privacy-safe) — landing era

- `move_cta_boske_clicked` / `move_cta_github_clicked` / `move_cta_cli_docs_clicked`
- No file-upload conversion metrics on marketing site
