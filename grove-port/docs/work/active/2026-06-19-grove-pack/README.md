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

## The smart insight

**Grove Port** = portable **history**. **Grove Pack** = portable **capability**.  
Everyone rebuilds “research mode” in every app. Open the manifest, keep curated content paid.

---

## Real-life use cases

### 1. Consultant shares research mode with a client

Author publishes `research-pack/` on GitHub. Client on Boske imports; colleague on another stack still validates YAML with `grove-pack validate`.

### 2. Team standardizes meeting notes

8-person team — same `systemPrompt` + `tools: [calendar-read, doc-write]`. HR updates pack version; `grove-pack inspect` shows diff.

### 3. Community pack → Boske Labs catalog path

Contributor submits pack PR. Boske Labs signs premium variant; free community version stays MIT on GitHub.

### 4. Tier-gated packs without a store

`tierMinimum: forest` in manifest. Boske enforces at import; CLI warns on mismatch for other tools.

→ Full scenarios: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md) § Grove Pack

---

## What already exists in Boske

| Asset | Status |
|-------|--------|
| Labs pack YAML in `config/labs/` | Infer schema — **content proprietary** |
| skills-labs-v1 work item | Field names + loader mapping |
| Pack loader service | Handshake target for import |

→ [`../../ecosystem/boske-extracts.md`](../../ecosystem/boske-extracts.md)

---

## Brand & license

- **Boske Labs** (spec + research)
- OSS: MIT spec + validator CLI
- **Paid hook:** Curated signed packs; Enterprise MCP packs

---

## Links

- Plan: [`plan.md`](./plan.md)
- Use cases: [`../../ecosystem/use-cases.md`](../../ecosystem/use-cases.md)

---

## Out of scope (v1)

- Pack marketplace / store
- Boske Labs signed catalog content (proprietary)
