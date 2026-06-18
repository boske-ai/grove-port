# Boske Community

**Open tools for portable, private AI.**

Boske Community is the **public OSS umbrella** under the Boske brand house — standards, plugins, docs, and migration tools. It is **not** the Boske product (proprietary) and **not** Boske Labs (R&D / models).

**GitHub:** https://github.com/boske-ai/grove-port (public, `main`)

**Start here:** [`docs/INDEX.md`](./docs/INDEX.md) — master capture of all planning decisions (June 2026).

Parent: [Canopy Studio](../../docs/STUDIO_MANIFEST.md) · Product: [Boske](../boske/) · Labs: [../boske-labs/README.md](../boske-labs/README.md)

---

## Grove ecosystem

Shared **Grove** naming for Community + Labs OSS (forest / portability metaphor):

| Project | Folder | Brand | Status |
|---------|--------|-------|--------|
| **Grove Port** | [`grove-port/`](./grove-port/) | Community | **Active** — workspace export standard + adapters |
| **Boske Pulse** | [`../boske-pulse/`](../boske-pulse/) | Community | Private → **MIT OSS** when config sanitized |
| Grove Guard | *(planned)* | Community | MCP / agent policy gateway |
| Grove Index | *(planned)* | Community | RAG index lifecycle |
| **Grove Fit** | [`../boske-labs/`](../boske-labs/) | Labs | Hardware → model tier fit |
| **Grove Pack** | Labs | Labs | Assistant pack **spec** (content stays paid) |
| Grove Trust | Labs | Labs | Model provenance verify |

Full map: [`grove-port/docs/ecosystem/grove-family.md`](./grove-port/docs/ecosystem/grove-family.md)

---

## Repo layout (on disk)

```
canopystudio/apps/
├── boske/                 # Product monorepo (proprietary)
├── boske-community/       # ← git repo root; you are here
│   ├── docs/INDEX.md      # Master planning doc
│   ├── MANIFEST.md
│   ├── TODO.md
│   └── grove-port/        # Flagship project
├── boske-labs/            # Labs OSS index + future projects
└── boske-pulse/           # Operator tool → Community OSS
```

| **GitHub (live):** | https://github.com/boske-ai/grove-port |

---

## Brand rules

| Boske Community (OSS) | Boske Labs (OSS) | Proprietary |
|------------------------|------------------|-------------|
| Grove Port, adapters, converter | Grove Fit, Trust, pack **spec** | Boske app |
| Grove Guard (later) | HF `boske-labs/*` models | Labs pack **prompts** |
| **Boske Pulse** (when public) | Benchmarks | Licensing / lease |
| | | Cloud secrets |

---

## Funnel

**Free Community tools → Boske product → paid Cloud / teams.**

1. User converts on **boske.dev/move** (Grove Port)
2. Imports into Boske
3. Pays for EU cloud, seats, SSO

Details: [`grove-port/docs/architecture/three-layers.md`](./grove-port/docs/architecture/three-layers.md)

---

## Backlog

| Scope | File |
|-------|------|
| Umbrella | [`TODO.md`](./TODO.md) |
| Grove Port | [`grove-port/TODO.md`](./grove-port/TODO.md) |
