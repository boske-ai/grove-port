# Grove Port

**Open standard for moving a whole AI workspace — not just chat logs.**

> *Your data in one box. Import anywhere.*

Grove Port is a signed, versioned file format plus free tools so people can export from ChatGPT, Claude, Open WebUI, LibreChat, and others — then import into Boske (or any tool that adopts the spec) **without live API bridges**.

**Tagline:** *Portable AI workspace.*  
**License:** [MIT](./LICENSE) — spec, schema, core, adapters, and CLI.  
**Hub:** [`../README.md`](../README.md)

---

## Open (MIT) vs closed (Boske)

| | Open in this repo (MIT) | Closed in Boske (proprietary) |
|---|-------------------------|-------------------------------|
| **What** | Spec, JSON Schema, `verify` / `inspect` / `convert` CLI, IN adapters | Import wizard, preview/commit UX, DB mapping, rollback, cloud, teams, SSO |
| **Who** | Anyone — offline, no account | Boske Local or Cloud users |
| **Promise** | Inspect, verify, and convert **without** installing Boske | Best place to **use** the workspace after import |

---

## User funnel

```
boske.dev/port (landing — explains, no upload)
        ↓
Boske app import (closed UX — preview, confirm, commit)
        ↓
optional: grove-port convert (CLI — large ZIPs, air-gapped, automation)
```

1. **[boske.dev/port](https://boske.dev/port)** — supported sources, privacy, CTAs. **Does not** receive or convert files.
2. **Boske import** — vendor ZIP/JSON or `.grove-port` → preview → import.
3. **CLI** — power users and large exports.

**Privacy:** boske.dev never receives exports; conversion runs in Boske or offline via CLI.

---

## Why this exists

| Problem today | Grove Port answer |
|---------------|-------------------|
| Chat exports are JSON-only; files must be re-uploaded | Attachments live **inside** the package |
| Each tool uses its own DB | **Neutral JSON in the middle** — DB mapping stays in each product |
| Switching tools means starting over | **Export file → import** — no permanent API coupling |
| Users don't trust closed formats | Open spec + `verify` CLI you can run offline |

---

## What's in the box

```
my-workspace.grove-port   (tarball)
├── manifest.json
├── data.json
├── attachments/
├── README.md
└── signature.sig
```

Wire compatibility: public name **Grove Port v1**; on-disk layout still accepts `boske-export-v1` / `grove-port-v1` roots.

### What `verify` proves

`grove-port verify` checks that every checksum matches and that the Ed25519 signature validates over the manifest exactly as written. That proves the package is **unaltered since it was signed**.

It does **not** prove who made it. A Grove Port manifest carries the public key that verifies it, so anyone can sign a package they authored. Treat a valid v1 signature as a tamper check, not as provenance — and treat the file the way you'd treat any download from its source. Details: [`SECURITY.md`](./SECURITY.md) · [spec](./spec/v1/README.md#signaturesig).

---

## Layers

| Layer | What | License |
|-------|------|---------|
| **1 — Core** | Spec, schema, pack / verify / inspect | MIT (this repo) |
| **2 — Adapters** | Vendor exports → Grove Port | MIT (this repo) |
| **3 — Boske product** | Import UX, DB mapping, rollback | Proprietary |
| **4 — Paid services** | Cloud, teams, SSO | Commercial |

Details: [`docs/architecture/three-layers.md`](./docs/architecture/three-layers.md).

---

## Repo layout

```
grove-port/
├── packages/
│   ├── schema/
│   ├── core/
│   ├── cli/
│   └── adapters/        # chatgpt, claude, openwebui, librechat, …
├── apps/
│   └── converter-web/   # dev-only demo (not the production funnel)
├── spec/v1/
└── docs/
```

### Nested GitHub layout

Clone this repo, then:

```bash
cd grove-port
bun install
bun run build
bun test
bun run grove-port -- verify path/to/export.grove-port
bun run grove-port -- convert --from chatgpt conversations.json -o out.grove-port --email you@example.com
```

---

## Related

| Project | Relationship |
|---------|----------------|
| [Boske Community hub](../README.md) | This repo’s umbrella README |
| [Boske Pulse](https://github.com/boske-ai/boske-pulse) | Sibling MIT operator tool |
| [Boske](https://boske.dev) | Product that imports Grove Port packages |

Backlog: [`TODO.md`](./TODO.md)

---

## Contributing

New IN adapters are the most useful thing you can add — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

Found a security issue? **Don't open a public issue** — see [`SECURITY.md`](./SECURITY.md).

---

## License

MIT — see [LICENSE](./LICENSE). The Boske product remains proprietary.
