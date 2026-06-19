# Grove Pack — assistant pack spec

**Status:** **draft — review `plan.md`**  
**Started:** 2026-06-19

---

## What

Open **format** for shareable assistant packs (Writing coach, Research, Meeting notes) — **not** Boske Labs curated content.

```yaml
# grove-pack.yaml
id: writing-coach
version: 1
requiresNetwork: false
tierMinimum: local
systemPrompt: |
  ...
tools: [file-search, workspace-dock]
```

---

## Why

| Audience | Pain | Pack spec fix |
|----------|------|---------------|
| Community | Every AI app invents its own “mode” format | One portable YAML manifest |
| Boske Labs | Want tier-gated curated packs without a store | Open spec + proprietary signed catalog |
| Self-hosters | Share prompts/tools configs across machines | `grove-pack validate` + import |

---

## Brand & license

- **Boske Labs** (spec + research)
- OSS: MIT spec + validator CLI
- **Paid hook:** Subscription includes curated, signed packs; Enterprise adds MCP packs

**Distinction:** **Grove Pack** = format. **Boske Labs packs** = proprietary YAML in `apps/backend/config/labs/`.

---

## Dependencies

- Aligns with Boske `2026-06-08-skills-labs-v1` work (monorepo)
- No Grove Port dependency

---

## Links

- Ecosystem: [`../../ecosystem/grove-family.md`](../../ecosystem/grove-family.md) § Grove Pack

---

## Out of scope (v1)

- Pack marketplace / store
- Boske Labs signed catalog content (proprietary)
