# Three layers — open source vs Boske product

What is free, what is product, and how Grove Port fits the funnel.

---

## Layer 1 — Free & open (this repo)

**MIT** — [github.com/boske-ai/grove-port](https://github.com/boske-ai/grove-port)

| Asset | Purpose |
|-------|---------|
| Grove Port v1 spec | Anyone can implement import/export |
| JSON Schema / Zod types | Validators for third parties |
| CLI `verify`, `inspect`, `convert` | Offline, no account |
| IN adapters | Migration from other tools |
| `@grove-port/convert-browser` | Library for apps; **not** the production website funnel |

**User promise:** inspect, verify, and convert without installing Boske.

Sibling Community OSS (separate repo): **[Boske Pulse](https://github.com/boske-ai/boske-pulse)**.

---

## Layer 2 — Boske product (proprietary)

| Asset | Purpose |
|-------|---------|
| Settings → Export / Import | Preview, commit, rollback |
| Vendor ZIP → adapters → DB | Native import (uses open packages) |
| Local ↔ Cloud wizards | Trial → paid, enterprise migration |
| RAG, voice, agents | Workspace, not just a file |

**User promise:** Boske is the best place to **use** the workspace after import.

---

## Layer 3 — Paid services (commercial)

| Service | Trigger |
|---------|---------|
| Boske Cloud (EU hosting) | Managed infra |
| Seats + SSO | Org rollout |
| Assisted migration | Large / custom imports |

**User promise:** free to leave (Layer 1); pay for team, cloud, and support.

---

## Funnel

```
boske.dev/port  (landing — explain + CTA; no upload)
        │
        ├── Open Boske → Import workspace
        │         └── Uses @grove-port/adapter-* (open) → Boske DB (closed)
        │
        └── Optional: CLI convert → import .grove-port or keep as backup
```

---

## What stays closed

| Asset | Why |
|-------|-----|
| Boske full app | Product |
| Import wizard + ImportService | Product UX / DB |
| License / lease signing keys | Security |
| Cloud secrets | Infra |

---

## Brand placement

| Layer | Brand |
|-------|-------|
| Grove Port + adapters + CLI | **Boske Community** |
| Boske Pulse | **Boske Community** (own repo) |
| Boske app + cloud + `/port` marketing | **Boske** (product) |
