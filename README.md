# Boske Community

**Open tools for portable, private AI.**

This repository is the public home of **Grove Port** — an MIT standard and toolkit for moving a whole AI workspace (not just chat logs).

**GitHub:** [github.com/boske-ai/grove-port](https://github.com/boske-ai/grove-port)

---

## Grove Port

Start here: [`grove-port/README.md`](./grove-port/README.md)

```bash
cd grove-port
bun install
bun run build
bun test
```

CLI (after build):

```bash
bun run grove-port -- verify path/to/file.grove-port
bun run grove-port -- convert --from chatgpt path/to/export.zip -o out.grove-port
```

---

## Related

| Project | Role |
|---------|------|
| **[Grove Port](./grove-port/)** | Portable AI workspace format, adapters, CLI (this repo) |
| **[Boske Pulse](https://github.com/boske-ai/boske-pulse)** | Operator Mac menu-bar health monitor (MIT) |
| **[Boske](https://boske.dev)** | Product — import vendor exports and run your workspace |

---

## Brand

| Open (MIT) | Proprietary |
|------------|-------------|
| Grove Port, Boske Pulse | Boske app, cloud, teams, SSO, signing keys |

Community tools stay free and offline-capable. Boske is the product that turns a portable package into a daily workspace.

---

## Funnel

1. Learn on **[boske.dev/port](https://boske.dev/port)** (landing only — no upload)
2. Import inside **Boske** (closed UX)
3. Optional: convert offline with the Grove Port CLI

---

## Contributing & security

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)

---

## License

MIT — see [`LICENSE`](./LICENSE) and [`grove-port/LICENSE`](./grove-port/LICENSE).
