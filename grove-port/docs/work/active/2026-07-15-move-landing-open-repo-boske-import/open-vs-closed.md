# Open vs closed — Grove Port inventory

What ships in the **public MIT repo** vs what stays **proprietary in Boske**.

---

## Open (Boske Community — this repo)

| Asset | Package / path | Notes |
|-------|----------------|-------|
| Grove Port v1 **spec** | `spec/`, docs | Anyone can implement |
| **JSON Schema / Zod** | `@grove-port/schema` | Validators |
| **Envelope** pack/unpack/verify | `@grove-port/core` | No Boske DB |
| **CLI** `verify`, `inspect`, `convert` | `@grove-port/cli` | Offline, no account |
| **IN adapters** | `@grove-port/adapter-*` | ChatGPT (incl. shards), Claude, Open WebUI, LibreChat, Gemini, Doubao, DeepSeek, LobeChat, AnythingLLM |
| **convert-browser** | `@grove-port/convert-browser` | Library for apps that want in-process convert; **not** required on boske.dev |
| **Fixtures / tests** | `packages/adapters/*/fixtures` | Synthetic only — no real user exports |
| **Architecture docs** | `docs/architecture/` | Three layers, adapters |

**User promise:** inspect, verify, and convert **without** installing Boske.

### Optional later (still open)

| Asset | Notes |
|-------|-------|
| OUT adapters (Grove → Open WebUI, …) | Optional; not required for launch |
| AMP/PAM IN adapters | Reuse converters |

---

## Closed (Boske product)

| Asset | Where | Why |
|-------|--------|-----|
| Boske **app** (desktop / web) | Boske monorepo | Product |
| **Import wizard** UX | Boske | Preview, confirm, errors, progress |
| **ImportService** + dry-run / commit | Boske | Tied to product DB |
| Grove ↔ **SQLite / Postgres / Mongo** mapping | Boske | Native layer |
| **Rollback**, conflict rules | Boske | Product |
| Cloud, teams, SSO, org admin | Boske Cloud | Commercial |
| RAG, agents, voice, presets runtime | Boske | Workspace value |
| Labs **pack content** | Boske Labs | Subscription |
| **Signing keys** (instance export) | Ops | Security — verify open, sign closed |
| Billing, infra secrets | Ops | Commercial / infra |

**User promise:** Boske is the best place to **use** the workspace after import.

---

## Website (marketing — not OSS “product”)

| Asset | Open? | Role |
|-------|-------|------|
| `/port` **landing** copy + CTAs | Public page | Educate; route to Boske |
| Converter **embed** (upload UI) | Retire from production | Dev-only or remove |
| Privacy / Data Promise pages | Public | Policy |

Website code lives in the **Boske website** app (proprietary site). Grove Port docs describe content; they don’t own the Next.js routes.

---

## Public repo checklist

Full launch gate: [`launch-checklist.md`](./launch-checklist.md).

Before flipping GitHub to **public**:

- [x] No `.env`, credentials, or real user export ZIPs in working tree (history scan: empty)
- [x] LICENSE = MIT at repo root (+ `grove-port/LICENSE`)
- [x] README: open surface + “Boske import is proprietary” + funnel + nested layout
- [x] Local `bun run build` + `bun test` green (2026-07-15, 96 pass)
- [x] CI workflow present (community root `.github/workflows/grove-port-ci.yml`)
- [x] Remote CI green on **committed** launch SHA (commit/push required first)
- [x] Nested `grove-port/` layout documented (`cd grove-port`; flatten optional later)
- [ ] Decide npm publish timing (**defer** — not required for flip)
- [x] `CONTRIBUTING.md` + `SECURITY.md` at community root
- [x] `workspace_items` defaults for legacy v1 + inspect `DATA_COLLECTION_KEYS` (2026-07-15)

**Do not** put in the public repo:

- Boske app source
- ImportService / DB mappers
- Cloud configs, secrets
- Real customer fixtures

---

## Dependency direction

```
Boske app (closed)
  └── depends on → @grove-port/adapter-* , core, schema (open)

boske.dev /port (marketing)
  └── links to → Boske import + GitHub (open)
  └── does NOT depend on → upload/convert pipeline
```

Adapters stay open; Boske **uses** them as dependencies. Competitors get converters, not your app.
