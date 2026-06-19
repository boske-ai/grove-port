# Plan: Grove Port foundation

**Approved:** 2026-06-18

---

## Goal

Ship a minimal, credible **Grove Port v1** open core:

1. Human-readable spec
2. `packages/schema` (Zod + JSON Schema export)
3. `packages/cli` — `verify`, `inspect`
4. `packages/adapters/chatgpt` — IN adapter
5. CI: round-trip against a fixture Boske export tarball

---

## Phase 1 — Spec & schema (no new semantics)

| Task | Output |
|------|--------|
| Copy `export-v1.ts` types into `packages/schema` | MIT header; no `@boske/*` import from Boske app at runtime |
| Write `spec/v1/README.md` | Manifest, data.json collections, attachment rules, signature |
| Document v1 alias | `grove-port-v1` ≡ `boske-export-v1` on the wire |
| JSON Schema emit | For third-party validators |

**Collections in `data.json` (v1):**

`user`, `conversations`, `messages`, `files`, `presets`, `agents`, `memories`, `tool_calls`, `transcript_sessions`, `shares`, `attachments` (refs + bytes in folder).

Foreign adapters may leave collections empty; `inspect` must report counts.

---

## Phase 2 — CLI

```bash
grove-port verify ./export.grove-port
grove-port inspect ./export.grove-port   # JSON summary of counts
grove-port convert --from chatgpt conversations.json -o out.grove-port
```

- Pure Node/Bun; no Boske backend
- Exit non-zero on checksum/signature failure
- `convert` delegates to adapter registry

---

## Phase 3 — ChatGPT IN adapter

**Input:** ChatGPT data export ZIP → `conversations.json` (DAG `mapping`).

**Output:** Partial Grove Port:

| Filled | Empty (ok) |
|--------|------------|
| `conversations`, `messages` | `agents`, `transcript_sessions`, most `files` |
| `manifest.counts` | Attachments unless export includes media |

**Reference:** [purmemo AMP converters](https://github.com/purmemo-ai/purmemo-amp) — do not depend on proprietary npm; reimplement minimal mapping or MIT-compatible subset.

**Edge cases:** fork/branches in ChatGPT tree → flatten to linear thread with metadata flag `source_fork: true`.

---

## Phase 4 — Boske handshake

| Task | Owner |
|------|-------|
| Boske ExportService produces tarball CLI can `verify` | Boske monorepo |
| Document import path: Settings → Import Grove Port | Boske monorepo |
| Add link from boske.dev docs to this repo | Website |

No code in this repo for Boske DB writes — only format compatibility tests with fixtures.

---

## Adapter roadmap (after Phase 3)

| Adapter | Input | Priority |
|---------|-------|----------|
| Claude | Anthropic export JSON | P1 |
| Mistral Le Chat | Settings export | P1 |
| Open WebUI | JSON export | P1 |
| AMP / PAM | `.amp.json` / PAM bundle | P2 (shortcut) |
| Open WebUI deep | `webui.db` SQLite | P2 |
| LibreChat | JSON export | P2 |
| Cursor | local SQLite | P3 |

---

## Database note (explicit)

**Grove Port does not have database adapters.**

| Layer | Knows DB? |
|-------|-----------|
| Grove Port core | No — JSON + files only |
| ChatGPT/Claude/… IN adapters | No — read vendor export files |
| Boske ExportService / ImportService | Yes — SQLite local, Postgres/Mongo cloud |

Boske reads its DB → writes Grove. Boske reads Grove → writes its DB. That mapping is **proprietary product code**, not Community OSS.

---

## Done criteria

- [ ] Spec published in `spec/v1/`
- [ ] `grove-port verify` passes on Boske-generated fixture
- [ ] `grove-port convert --from chatgpt` produces valid package
- [ ] `inspect` shows honest partial counts for ChatGPT import
- [ ] MIT LICENSE on all packages
- [ ] README links three layers + online converter (planned)

---

## Risks

| Risk | Mitigation |
|------|------------|
| Schema drift from Boske | Single source: extract from data-provider; CI contract test |
| ChatGPT format changes | Adapter version `source_format: chatgpt-export-v1` in manifest |
| Users expect files from ChatGPT | Preview: "0 attachments — re-upload docs in Boske Sources" |
