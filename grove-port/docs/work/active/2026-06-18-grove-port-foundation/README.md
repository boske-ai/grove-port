# Grove Port — foundation (spec, schema, CLI, first adapter)

**Status:** **approved — execute `plan.md`**  
**Started:** 2026-06-18

---

## What

Stand up the **Grove Port** open-source repo: public spec, extracted schema, offline CLI (`verify`, `inspect`), and the first **IN adapter** (ChatGPT) so Boske and boske.dev can consume a real `.grove-port` file.

This is the **base layer**. Everything else (Claude, Mistral, online converter, Boske import UX) plugs in as adapters or product work.

---

## Why

1. **Trust** — EU buyers and privacy users need a visible, open exit format.
2. **Growth** — converting ChatGPT / Open WebUI exports is the lowest-friction path onto Boske.
3. **Already started** — Boske `export-v1` + ADR 0009; this repo publishes that contract under the Grove Port name.

---

## Links

- Community master index: [`../../docs/INDEX.md`](../../docs/INDEX.md)
- Boske schema: `apps/boske/packages/data-provider/src/export-v1.ts`
- ADR: `apps/boske/docs/decisions/0009-gdpr-and-migration-strategy.md`
- Architecture: [`../../architecture/core-and-adapters.md`](../../architecture/core-and-adapters.md)
- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md)

---

## Out of scope (this folder)

- Boske Settings UI (stays in boske monorepo)
- Online converter (separate work folder)
- OUT adapters to non-Boske tools (P2)
