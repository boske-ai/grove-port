# Grove Port

**Open standard for moving a whole AI workspace — not just chat logs.**

> *Your data in one box. Import anywhere.*

**Community hub:** [`../README.md`](../README.md) · **Master index (read first):** [`../docs/INDEX.md`](../docs/INDEX.md)

Grove Port is the **Boske Community** flagship OSS project: a signed, versioned file format plus free tools so people can export from ChatGPT, Claude, Open WebUI, Mistral, LibreChat, and Boske — then import into Boske (or other tools that adopt the spec) **without live API bridges**.

**Tagline:** *Portable AI workspace.*

**Brand:** [Boske Community](https://boske.dev) (standards, plugins, docs) — sibling to Boske Labs (R&D) and the Boske product.

---

## Why this exists

| Problem today | Grove Port answer |
|---------------|-------------------|
| Chat exports are JSON-only; files must be re-uploaded | Attachments live **inside** the package |
| AMP/PAM cover conversations or memory, not a full workspace | One envelope: chats, files, agents, transcripts, presets |
| Each tool uses its own DB (SQLite, Postgres, Mongo) | **Neutral JSON in the middle** — DB mapping stays in each product |
| Switching tools means starting over | **Export file → import** — no permanent API coupling |
| Users don't trust vendors | Open spec + `verify` CLI + optional online converter on boske.dev |

**Commercial wedge:** free format and converters; **Boske** is the best place to import, work with a team, and host in the EU.

---

## Architecture (one sentence)

**Thick core + thin adapters:** Grove Port defines one canonical package; adapters translate **in** (ChatGPT → Grove) and **out** (Grove → Open WebUI); Boske maps Grove ↔ its own database internally.

See [`docs/architecture/core-and-adapters.md`](./docs/architecture/core-and-adapters.md).

---

## What's in the box

```
my-workspace.grove-port   (tarball)
├── manifest.json       # counts, dates, checksums, signature metadata
├── data.json           # neutral records (conversations, messages, files, agents, …)
├── attachments/        # real file bytes (PDFs, images, audio)
├── README.md           # human-readable explainer
└── signature.sig       # Ed25519 integrity (required for enterprise / instance exports)
```

Initial implementation aligns with Boske's in-flight `boske-export-v1` schema ([ADR 0009](https://github.com/boske-ai/boske/blob/main/docs/decisions/0009-gdpr-and-migration-strategy.md) in the Boske monorepo). Public name: **Grove Port v1**; wire compatibility with `boske-export-v1` until a deliberate v2 bump.

---

## Three layers (open vs product)

| Layer | What | License |
|-------|------|---------|
| **1 — Grove Port core** | Spec, schema, `verify` / `inspect` CLI | MIT (this repo) |
| **2 — Adapters** | ChatGPT, Claude, Mistral, Open WebUI, AMP/PAM → Grove | MIT (this repo) |
| **3 — Boske product** | Settings export/import, preview, rollback, cloud/on-prem migration | Proprietary |
| **4 — Paid services** | Boske Cloud, teams, SSO, assisted migration | Commercial |

Details: [`docs/architecture/three-layers.md`](./docs/architecture/three-layers.md).

---

## Online converter (planned)

Public tool on **boske.dev** (or `convert.boske.dev`):

1. User uploads vendor export (e.g. ChatGPT `conversations.json` ZIP).
2. Browser or edge worker runs adapter → Grove Port package.
3. User downloads `.grove-port` or imports directly into Boske (OAuth handoff).

**Privacy:** client-side conversion where possible; no upload retention; clear “files processed locally” copy.

Work folder: [`docs/work/active/2026-06-18-online-converter/`](./docs/work/active/2026-06-18-online-converter/README.md).

---

## Grove ecosystem (sibling projects)

Grove Port is **in progress** (this repo). New Grove OSS backlog:

| Project | Brand | Status |
|---------|-------|--------|
| **Grove Port** | Community | **In progress** (this repo) |
| **Online converter** | Community | **In progress** — pairs with Port |
| **Grove Guard** | Community | Draft plan — [`work folder`](./docs/work/active/2026-06-19-grove-guard/) |
| **Grove Pack** | Labs | Draft plan — assistant pack spec |
| **Grove Index** | Community | Draft plan — RAG index lifecycle |
| **Grove Trust** | Labs | Draft plan — model provenance |

Elsewhere: Grove Fit (in progress), Boske Pulse (done — reference only).

Full write-up: [`docs/ecosystem/grove-family.md`](./docs/ecosystem/grove-family.md).

---

## Repo layout (target)

```
grove-port/
├── packages/
│   ├── schema/          # Zod + JSON Schema (extracted from @boske/data-provider)
│   ├── cli/             # grove-port verify | inspect | convert
│   └── adapters/        # chatgpt, claude, mistral, openwebui, …
├── apps/
│   └── converter-web/   # boske.dev online tool (later)
├── spec/
│   └── v1/              # human-readable spec markdown
└── docs/
```

See [`docs/REFERENCES.md`](./docs/REFERENCES.md) · Master index: [`../docs/INDEX.md`](../docs/INDEX.md)

---

## Backlog

See [`TODO.md`](./TODO.md).

---

## Related repos

| Repo | Relationship |
|------|----------------|
| [`boske-community/`](../README.md) | Community OSS umbrella (this project lives here) |
| [`boske-labs/`](../../boske-labs/README.md) | Labs OSS index (Grove Fit, Pack spec, Trust) |
| [`boske/`](../../boske/) | Reference implementation; `export-v1` source |
| [`boske-pulse/`](../../boske-pulse/) | Operator HUD — **planned MIT** under Boske Community |

---

## License

MIT — see [LICENSE](./LICENSE). Boske product and curated Labs pack **content** remain proprietary.
