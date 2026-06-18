# Three layers — open source vs Boske product

Simple map of what is free, what is paid, and how money connects to Grove Port.

---

## Layer 1 — Free & open (Boske Community)

**Where:** this repo (`grove-port`), MIT license. GitHub repo is **private until launch**.

| Asset | Purpose |
|-------|---------|
| Grove Port v1 spec | Anyone can implement import/export |
| JSON Schema / Zod types | Validators for third parties |
| CLI `verify`, `inspect`, `convert` | Offline, no account |
| IN adapters (ChatGPT, Claude, …) | Migration from other tools |
| OUT adapters (optional) | Export toward other tools |
| Online converter (bundled adapters) | boske.dev/move — browser convert |

**User promise:** you can inspect, verify, and convert without installing Boske.

---

## Layer 2 — Boske product (proprietary)

**Where:** `canopystudio/apps/boske` monorepo.

| Asset | Purpose |
|-------|---------|
| Settings → Export / Import | Best UX, preview, rollback |
| DB mapping (SQLite / Postgres / Mongo) | Native layer |
| Local ↔ Cloud ↔ On-prem wizards | Trial→paid, enterprise migration |
| Org admin bulk export | Multi-seat |
| RAG, voice, agents working together | Workspace, not just a file |
| Signed instance-to-instance exports | Enterprise integrity |

**User promise:** Boske is the best place to **use** the workspace after import.

---

## Layer 3 — Paid services (commercial)

**Where:** boske.dev billing, Boske Cloud, sales-assisted deploys.

| Service | Trigger |
|---------|---------|
| Boske Cloud (EU hosting) | Team wants managed infra |
| Seats + SSO | Org rollout |
| Private Cloud / On-prem | Compliance |
| Assisted migration | Large export, custom mapping |
| SLA + audit log export | Enterprise |

**User promise:** free to leave (Layer 1); pay when you want **team, cloud, and support**.

---

## Funnel (why we open-source Layer 1)

```
Google "ChatGPT export Boske"
        │
        ▼
boske.dev/move  (free convert)
        │
        ├── Download .grove-port  (trust, no signup)
        │
        └── Import into Boske  (signup → Local or Cloud)
                    │
                    └── Paid tier when team/cloud needed
```

**Adapters are the sales team** — they move clients from other platforms without API partnerships.

---

## What never goes open source

| Asset | Why |
|-------|-----|
| Boske full app | Product |
| Labs pack **content** (prompts, procedures) | Subscription value |
| License / lease signing keys | Security |
| Boske Pulse | Operator private tool |
| Cloud proxy secrets | Infra |

---

## Brand placement

| Layer | Brand |
|-------|-------|
| Grove Port + adapters + converter | **Boske Community** |
| Boske app + cloud | **Boske** (product) |
| Grove Fit, Grove Trust, pack spec | **Boske Labs** (see ecosystem doc) |

Parent credit: **Canopy Studio** (small footer).
