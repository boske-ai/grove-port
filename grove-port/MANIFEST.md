# Grove Port — Project Manifest

*For AI agents and developers.*

**Community hub:** read [`../docs/INDEX.md`](../docs/INDEX.md) before changing scope.

**Brand house:** Boske Community · **Master index:** [`../docs/INDEX.md`](../docs/INDEX.md)

---

## Purpose

**Grove Port** is an open standard and toolchain for **portable AI workspaces**: export everything (chats, attachments, agents, transcripts, presets) in one signed package; import without vendor API lock-in.

Primary funnel: **bring users from ChatGPT, Claude, Mistral, Open WebUI, LibreChat into Boske** via conversion, not integration spaghetti.

---

## Trust moment

Users and EU buyers must believe data is **theirs** — exportable, verifiable, deletable. Grove Port is the public proof. The format must stay auditable (MIT, spec in git, verify CLI).

---

## What we build (and refuse)

| We build | We refuse |
|----------|-----------|
| Neutral envelope spec + MIT CLI | Another proprietary chat-only export |
| IN adapters from major platforms | Storing user uploads on convert.boske.dev |
| Online converter with local-first processing | “Community edition” license bypasses |
| Documented three-layer model (OSS / product / paid) | Open-sourcing Boske Labs pack prompts or full app |
| Compatibility with Boske `export-v1` | Breaking v1 without version bump |

---

## Architecture invariant

```
Foreign export ──► [IN adapter] ──► Grove Port v1 ──► [OUT adapter] ──► Foreign import
                                        │
                                        ▼
                              Boske native (DB ↔ Grove)
```

- **Grove Port core never mentions Postgres, SQLite, or Mongo.**
- **Adapters for ChatGPT/Claude read vendor files, not databases.**
- **Boske alone maps Grove JSON ↔ its deployment DB.**

---

## Data & privacy (converter + CLI)

| Aspect | Posture |
|--------|---------|
| **Online tool** | Prefer in-browser conversion; if server-side, zero retention, no training |
| **CLI** | Fully offline; no network required |
| **Signature** | Ed25519; public keys in manifest |
| **GDPR** | Format supports single-subject export (`manifest.user_id`) |

---

## Repo & disk layout

| Location | Role |
|----------|------|
| `~/apps/canopystudio/apps/boske-community/grove-port/` | Project path under Community umbrella |
| `~/apps/canopystudio/apps/boske-community/` | Community hub README + future OSS siblings |
| `github.com/boske-ai/grove-port` | Planned public remote (project name; org brand Boske Community) |
| `apps/boske/docs/work/active/2026-06-18-wizard-user-preferences/` | Unrelated; Boske product work stays in boske monorepo |

---

## Agent guardrails

- Plan in `docs/work/active/` before code (same discipline as Boske AGENTS.md).
- Extract schema from `@boske/data-provider` — do not fork divergent types.
- Adapters are **partial fills** of `data.json`; preview must show what's missing.
- Marketing name: **Grove Port**; wire id may remain `boske-export-v1` for v1 compatibility.

---

## Open-source path

1. **Now:** docs + TODO + work folders (this repo).
2. **Next:** extract `packages/schema` + `packages/cli` from Boske; MIT license.
3. **Then:** ChatGPT IN adapter + boske.dev converter MVP.
4. **Publish:** `boske-ai/grove-port` public under Boske Community.
