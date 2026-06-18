# Boske Community & Grove — master index

*Single entry point. Captures decisions from the June 2026 planning conversation so nothing is lost.*

**Read order:** this file → [`../README.md`](../README.md) → [`../grove-port/README.md`](../grove-port/README.md) → [`decisions.md`](./decisions.md)

---

## 1. What we decided

| Decision | Detail |
|----------|--------|
| **Flagship OSS** | **Grove Port** — standard file format for a **whole AI workspace** (not just chat) |
| **Brand** | Grove Port = **Boske Community** (not Labs, not the paid product) |
| **Architecture** | **Thick core + thin adapters** — neutral JSON tarball in the middle |
| **Migration strategy** | **Export file → import elsewhere** — no live API bridges between tools |
| **Funnel** | Free converters → **import into Boske** → paid Cloud / teams / SSO |
| **Online tool** | **boske.dev/move** — upload ChatGPT/etc., convert in browser, download or import |
| **Folder layout** | `apps/boske-community/grove-port/` (git repo root = `boske-community/`) |
| **Labs OSS** | Grove Fit, Grove Pack **spec**, Grove Trust → `apps/boske-labs/` |
| **Pulse OSS** | **Yes** — MIT under Boske Community when config is sanitized (not Labs, not in customer DMG) |
| **Wire format v1** | Compatible with Boske `boske-export-v1` / ADR 0009 until v2 |
| **GitHub name** | Public repo likely **`boske-ai/grove-port`** (memorable); on-disk umbrella `boske-community/` |

---

## 2. Brand map (Boske house)

```
BOSKE (brand house — boske.dev)
├── Boske (product)           proprietary — Local / Cloud / Enterprise
├── Boske Labs (R&D)          Grove Fit, Pack spec, Trust, HF models
├── Boske Community (OSS)     Grove Port, Grove Guard, Pulse, converter
└── Boske Pulse               operator Mac HUD — Community OSS when ready
```

**Not a license tier:** “Boske Community” is not a product SKU. `supportTier: community` in Boske = lowest support level for trials.

---

## 3. Grove Port in one paragraph

Grove Port is an open, signed package containing chats, **attachments inside the box**, agents, transcripts, presets, and metadata. Adapters convert **ChatGPT, Claude, Mistral, Open WebUI, LibreChat, AMP/PAM** exports **into** Grove Port; Boske (and others) import **from** Grove Port. Postgres vs SQLite vs Mongo **only matters inside Boske** — the port file is always the same JSON + files.

---

## 4. Adapter model

```
ChatGPT / Claude / Mistral / Open WebUI
        │
        ▼  IN adapter (reads vendor export FILE, not DB)
   GROVE PORT v1  ← spec, verify, inspect (OSS)
        │
        ├──► Boske native (DB ↔ Grove) — proprietary
        └──► OUT adapter (optional) → other tools
```

| Adapter type | Open source? | Example |
|--------------|--------------|---------|
| IN | Yes | `convert --from chatgpt conversations.json` |
| OUT | Yes (optional) | `convert --to openwebui` |
| Native (Boske DB) | No | Settings → Export / Import |

**Partial imports OK** — ChatGPT may fill only conversations/messages; preview must say “0 files, 0 agents”.

---

## 5. Three layers (money)

| Layer | What | License |
|-------|------|---------|
| 1 | Spec, CLI, IN adapters, online converter | MIT — Community |
| 2 | Boske app export/import UX, RAG, voice, teams | Proprietary |
| 3 | Boske Cloud, seats, SSO, assisted migration | Commercial |

Pattern: **PostHog / Langfuse** — open core, paid cloud + teams.

---

## 6. Real use cases (keep for marketing)

1. **Trial → paid** — same data after upgrade (internal Grove round-trip).
2. **GDPR export** — one signed package for the data subject.
3. **Cloud → on-prem** — law firm / gov moves off EU cloud to own servers.
4. **ChatGPT → Boske** — converter on boske.dev/move, no OpenAI API.
5. **Open WebUI → Boske** — self-hoster keeps history + later files via full export.
6. **Backup** — nightly `.grove-port` to NAS before upgrade.
7. **Leaving Boske** — export still works; trust, not trap.

---

## 7. Competitors (what exists — we fill the gap)

| Project | Scope | Grove Port difference |
|---------|-------|---------------------|
| AMP / purmemo | Conversations + memory | + files in box + agents + transcripts + team migration |
| PAM | Memories + conversation index | + full workspace + attachments |
| Agent File (.af) | Single agent | Whole workspace |
| ALF / AGX | Agent state / graph | Workspace product data |
| Open WebUI | Chat JSON import; files re-upload | Cross-vendor standard + signed + fat export |
| LibreChat | JSON backup; attachments manual | Same |

We may **import from** AMP/PAM as IN adapters; Grove Port is the **superset hub**.

---

## 8. Online converter (boske.dev/move)

| Step | Behavior |
|------|----------|
| Upload | ChatGPT ZIP, Claude export, etc. |
| Convert | **Same adapters as CLI** — prefer **Web Worker** (no server retention) |
| Preview | “412 chats, 0 files” |
| Actions | Download `.grove-port` **or** Import into Boske (OAuth) |

Privacy: no retention, no training, no account required for download-only.

Plan: [`../grove-port/docs/work/active/2026-06-18-online-converter/`](../grove-port/docs/work/active/2026-06-18-online-converter/)

---

## 9. Grove ecosystem (all projects)

| Project | Brand | Folder (planned) | Status |
|---------|-------|------------------|--------|
| **Grove Port** | Community | `grove-port/` | **Active** |
| **Boske Pulse** | Community | `../boske-pulse/` | OSS after sanitize |
| Grove Guard | Community | `grove-guard/` (later) | Planned |
| Grove Index | Community/Labs | TBD | Planned |
| Grove Fit | Labs | `../boske-labs/grove-fit/` | Planned |
| Grove Pack spec | Labs | `../boske-labs/grove-pack/` | Planned |
| Grove Trust | Labs | Labs | Planned |

Detail: [`../grove-port/docs/ecosystem/grove-family.md`](../grove-port/docs/ecosystem/grove-family.md)

---

## 10. On-disk layout (Canopy Studio)

```
canopystudio/apps/
├── boske/                 # Product monorepo (proprietary)
├── boske-community/       # ← git repo root; Community OSS hub
│   ├── docs/INDEX.md      # ← this file
│   ├── grove-port/        # Flagship project
│   └── README.md
├── boske-labs/            # Labs OSS index (no code yet)
└── boske-pulse/           # Operator tool → Community MIT later
```

Studio doc: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)

---

## 11. Still in Boske monorepo (not duplicated here)

| Asset | Path |
|-------|------|
| Schema source of truth (until extract) | `boske/packages/data-provider/src/export-v1.ts` |
| ADR | `boske/docs/decisions/0009-gdpr-and-migration-strategy.md` |
| Export/import services | `boske/apps/backend/server/services/Export/` |
| Import UI / migration wizards | Boske frontend (planned) |
| Brand / pricing copy | `boske/ABOUT_BOSKE.md`, website |

---

## 12. Build order

1. Extract schema + CLI (`verify`, `inspect`) from Boske
2. ChatGPT IN adapter
3. Boske import preview + commit
4. **boske.dev/move** (client-side convert)
5. Claude, Mistral, Open WebUI adapters
6. Publish `github.com/boske-ai/grove-port`
7. Pulse public MIT (after example config scrub)
8. Grove Guard / Fit when approved

Backlog: [`../grove-port/TODO.md`](../grove-port/TODO.md)

---

## 13. What stays proprietary

- Boske app, cloud, licensing, lease signing keys
- Boske Labs **pack content** (prompts in `config/labs/`)
- Boske native DB import/export implementation (uses open format, not open app)
- Production secrets, Hetzner configs

---

## 14. Pulse OSS checklist (before public)

- [ ] Scrub `boske-production.example.json` (no real IPs)
- [ ] MIT LICENSE on `boske-pulse`
- [ ] Never ship inside customer Boske DMG
- [ ] Keychain-only tokens; config gitignored
- [ ] List under Boske Community on boske.dev

Ref: [`../boske-pulse/MANIFEST.md`](../boske-pulse/MANIFEST.md)

---

*Last updated: 2026-06-18 — planning conversation capture.*
