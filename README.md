# Boske Community

**Open tools for portable, private AI.**

Boske Community is the **public OSS umbrella** under the Boske brand house — standards, plugins, docs, and migration tools. It is **not** the Boske product (proprietary) and **not** Boske Labs (R&D / models).

**GitHub:** https://github.com/boske-ai/grove-port (**private** until launch, `main`)

**Start here:** [`docs/INDEX.md`](./docs/INDEX.md) — master capture of all planning decisions (June 2026).

Parent: [Canopy Studio](../../docs/STUDIO_MANIFEST.md) · Product: [Boske](../boske/) · Labs: [../boske-labs/README.md](../boske-labs/README.md)

---

## Grove ecosystem

| Project | Folder | Brand | Status |
|---------|--------|-------|--------|
| **Grove Port** | [`grove-port/`](./grove-port/) | Community | **In progress** |
| **Online converter** | [`grove-port/docs/work/active/2026-06-18-online-converter/`](./grove-port/docs/work/active/2026-06-18-online-converter/) | Community | **In progress** |
| **Grove Fit** | [`../boske-labs/`](../boske-labs/) | Labs | In progress (separate) |
| **Boske Pulse** | [`../boske-pulse/`](../boske-pulse/) | Community | **Done** (reference only) |
| **Grove Sign** | [`grove-port/docs/work/active/2026-06-19-grove-sign/`](./grove-port/docs/work/active/2026-06-19-grove-sign/) | Community | P1 — extract from export-v1 |
| **Grove Guard** | [`grove-port/docs/work/active/2026-06-19-grove-guard/`](./grove-port/docs/work/active/2026-06-19-grove-guard/) | Community | P1 — MCP firewall |
| **Grove Vault** | [`grove-port/docs/work/active/2026-06-19-grove-vault/`](./grove-port/docs/work/active/2026-06-19-grove-vault/) | Community | **P1** — opaque handles |
| **Grove Pack** | [`grove-port/docs/work/active/2026-06-19-grove-pack/`](./grove-port/docs/work/active/2026-06-19-grove-pack/) | Labs | P2 — portable modes |
| **Grove Bridge** | [`grove-port/docs/work/active/2026-06-19-grove-bridge/`](./grove-port/docs/work/active/2026-06-19-grove-bridge/) | Community | P2 — not a trap |
| **Grove Index** | [`grove-port/docs/work/active/2026-06-19-grove-index/`](./grove-port/docs/work/active/2026-06-19-grove-index/) | Community | P3 — stale RAG |
| **Grove Trust** | [`grove-port/docs/work/active/2026-06-19-grove-trust/`](./grove-port/docs/work/active/2026-06-19-grove-trust/) | Labs | P4 — verify GGUF |
| **Stack A Search** | [`grove-port/docs/work/active/2026-06-19-stack-a-search/`](./grove-port/docs/work/active/2026-06-19-stack-a-search/) | Community | Infra — private web |

**Use cases:** [`grove-port/docs/ecosystem/use-cases.md`](./grove-port/docs/ecosystem/use-cases.md)

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
