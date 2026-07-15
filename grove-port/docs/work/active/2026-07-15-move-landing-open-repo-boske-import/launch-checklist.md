# Launch checklist — public MIT repo

**Target:** `github.com/boske-ai/grove-port` → **public**  
**Date prepared:** 2026-07-15 (Track B)  
**Re-verified:** 2026-07-15 (pre-flight for visibility flip)  
**Docs hygiene (Phase E):** 2026-07-15 — plan Track C synced; `/port` funnel docs; CONTRIBUTING/SECURITY linked from community README; converter-web DEV-ONLY clarified; open-vs-closed CI row corrected.

**Repo fact:** Git root is **`boske-community`** (nested `grove-port/`). Remote `origin` = `https://github.com/boske-ai/grove-port.git`. Visibility today: **PRIVATE**.

---

## Pre-flight (all must pass before visibility flip)

### Secrets & artifacts scan

| Check | Status | Notes |
|-------|--------|-------|
| No `.env` files in tree | ✅ | `glob **/.env*` → 0 |
| No `.env` / credentials tracked in git | ✅ | `git ls-files` — no matches |
| No `.pem` / `.key` / cert files | ✅ | glob → 0 |
| No API key patterns (`sk-`, `ghp_`, `AKIA`) | ✅ | grep — no real keys |
| No `*.grove-port` artifacts committed | ✅ | `.gitignore` covers; none tracked |
| Fixtures are synthetic only | ✅ | adapter fixtures = test JSON/ZIP only |
| No absolute `/Users/...` leaks in tracked sources | ✅ | |
| Full history: `*.env` / `*.grove-port` | ✅ | `git log --all --full-history` → empty |
| Grep hits reviewed | ✅ | `stop_tokens`, test `thinking: 'secret'`, docs — benign |

### License & docs

| Check | Status | Notes |
|-------|--------|-------|
| Root `LICENSE` = MIT | ✅ | community root + `grove-port/LICENSE` |
| `CONTRIBUTING.md` | ✅ | community root (2026-07-15) |
| `SECURITY.md` | ✅ | community root (2026-07-15) |
| README: open (MIT) vs closed (Boske) | ✅ | |
| README: funnel **`/port`** → Boske import → CLI | ✅ | production URL is `/port`, not `/move` |
| README: nested `grove-port/` layout note | ✅ | |
| `open-vs-closed.md` inventory current | ✅ | |

### Build & test (local, 2026-07-15 re-verify)

```bash
cd grove-port   # nested under boske-community
bun install
bun run build   # ✅ all packages exit 0
bun test        # ✅ 97 pass, 0 fail
```

| Check | Status |
|-------|--------|
| `bun run build` | ✅ green |
| `bun test` | ✅ 97 pass / 0 fail |

### CI

| Check | Status | Notes |
|-------|--------|-------|
| GitHub Actions workflow | ✅ | `.github/workflows/grove-port-ci.yml` at **community root** (`paths: grove-port/**`) |
| Remote CI green on launch SHA | ✅ | `e3309ac` — run [29417492129](https://github.com/boske-ai/grove-port/actions/runs/29417492129) success |
| Visibility | ✅ | **PUBLIC** as of 2026-07-15 |

### Layout & publish

| Check | Status | Notes |
|-------|--------|-------|
| Nested `grove-port/` layout decision | ⚠️ waived | Keep nested; document `cd grove-port` (README). Flatten later optional. |
| npm publish `@grove-port/*` | ⬜ **defer** | Not required for launch. Sibling/`GROVE_PORT_ROOT` until third-party need. |
| Boske app / website / Pulse **not** in tree | ✅ | OSS packages only |
| Zip-bomb decompression budgets in core | ⚠️ waived for flip | Tracked follow-up; hosts must enforce upload limits (Boske does). |
| `workspace_items` legacy default + inspect keys | ✅ | 2026-07-15 Bugbot fix |

### Out of scope (other tracks)

| Item | Owner | Status |
|------|--------|--------|
| `/port` landing ships (no upload) | Track A — Boske website | ✅ |
| Boske vendor import wizard | Track C — Boske monorepo | ✅ Waves 2–3 |

---

## GO / NO-GO (2026-07-15)

| Gate | Result |
|------|--------|
| Secrets / history clean | **GO** |
| License + CONTRIBUTING + SECURITY | **GO** |
| Local build + 97 tests | **GO** |
| CI workflow present | **GO** |
| Working tree committed + pushed; remote CI green on that SHA | **GO** (`e3309ac`) |
| Human ops: visibility flip | **GO** — repo is **PUBLIC** |

**Verdict:** **LAUNCHED** — https://github.com/boske-ai/grove-port is public MIT. npm publish still deferred.

---

## Manual ops — GitHub visibility (human only)

> **Do not run until every required pre-flight row is ✅ (or explicitly waived).**

- [x] Commit + push launch branch / `main` (include `CONTRIBUTING.md`, `SECURITY.md`, work folder, schema/adapters, docs)
- [x] Confirm CI green on remote for that SHA (`grove-port` workflow)
- [x] Final human review: no secrets in working tree or recent commits
- [x] **Flip visibility to public** — done 2026-07-15
- [x] Verify public clone: `git clone … && cd grove-port && bun install && bun run build && bun test` → 97 pass
- [ ] Update `boske.dev/port` GitHub link if needed
- [x] Community README: remove “private until launch”
- [ ] Optional: `npm publish` for `@grove-port/*` (deferred)

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Track B implementer | Cursor agent | 2026-07-15 |
| Ops / repo admin | Cursor agent (user-authorized) | 2026-07-15 |
