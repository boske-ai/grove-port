# Boske Community — manifest

*For AI agents and developers.*

**Studio:** [STUDIO_MANIFEST.md](../../docs/STUDIO_MANIFEST.md) · **Product:** [Boske](../boske/MANIFEST.md) · **Labs index:** [../boske-labs/README.md](../boske-labs/README.md)

---

## Purpose

**Boske Community** is the open-source umbrella for Boske: standards, migration tools, plugins, and operator utilities that build trust and funnel users to the **Boske product** without open-sourcing the workspace app.

**Master doc:** [`docs/INDEX.md`](./docs/INDEX.md) — read before changing anything here.

---

## Active projects

| Project | Path | Role |
|---------|------|------|
| **Grove Port** | [`grove-port/`](./grove-port/) | Flagship — portable AI workspace format + adapters |
| **Boske Pulse** | [`../boske-pulse/`](../boske-pulse/) | Operator Mac HUD — planned MIT Community OSS |

---

## Agent guardrails

1. **Grove Port = Community**, Grove Fit/Trust = **Labs**, packs **content** = proprietary.
2. Plan in `grove-port/docs/work/active/` before code (same as Boske AGENTS.md).
3. Do not duplicate `export-v1.ts` — extract from `@boske/data-provider` when implementing schema.
4. Pulse: scrub example config before any public push.
5. Online converter: zero retention, prefer client-side conversion.

---

## Git

**Repo root:** `boske-community/` (includes hub docs + `grove-port/` project).

```bash
cd ~/apps/canopystudio/apps/boske-community
git init -b main   # if not already initialized
git add -A && git commit -m "docs: boske community hub and grove port planning"
```

Planned remote: `github.com/boske-ai/grove-port` or `boske-ai/boske-community`.
